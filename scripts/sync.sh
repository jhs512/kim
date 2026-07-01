#!/usr/bin/env bash
# kim-1 vault → Drive node-sheet projection (thin I/O shell). (issue 06, gws side)
# All logic lives in the tested node modules; this only drives gws.
# Layout: kim-1/{namespace}/{doctype}/{document}. Usage: bash scripts/sync.sh
set -euo pipefail
cd "$(dirname "$0")/.."

GWS=/c/Users/jangk/bin/gws
OUT="${CLAUDE_JOB_DIR:-.}/sync-payloads"; mkdir -p "$OUT"
SYNC_DIR=.sync; mkdir -p "$SYNC_DIR"
FOLDER=""; [ -f "$SYNC_DIR/folder-id" ] && FOLDER=$(cat "$SYNC_DIR/folder-id")

# strip gws's "Using keyring backend:" preamble before JSON.parse
jget() { grep -v -i keyring | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(eval(process.argv[1]))}catch(e){console.log("")}})' "$1"; }

declare -A FCACHE
ensure_folder() { # $1=parentId $2=name → echoes child folder id (created if absent)
  local parent="$1" name="$2" key="$1/$2" id
  [ -z "$parent" ] && { echo ""; return; }
  [ -n "${FCACHE[$key]:-}" ] && { echo "${FCACHE[$key]}"; return; }
  local q="name = '$name' and mimeType='application/vnd.google-apps.folder' and '$parent' in parents and trashed=false"
  id=$("$GWS" drive files list --params "{\"q\":\"$q\",\"fields\":\"files(id)\"}" --format json 2>/dev/null | jget '(j=JSON.parse(d),j.files&&j.files[0]&&j.files[0].id)||""')
  [ -z "$id" ] && id=$("$GWS" drive files create --json "{\"name\":\"$name\",\"mimeType\":\"application/vnd.google-apps.folder\",\"parents\":[\"$parent\"]}" --format json 2>/dev/null | jget '(JSON.parse(d)).id||""')
  FCACHE[$key]="$id"; echo "$id"
}

place() { # $1=fileId $2=targetFolder — move only if not already there
  [ -z "$2" ] && return
  local cur
  cur=$("$GWS" drive files get --params "{\"fileId\":\"$1\",\"fields\":\"parents\"}" --format json 2>/dev/null | jget '(JSON.parse(d).parents||[]).join(",")')
  [ "$cur" = "$2" ] && return
  "$GWS" drive files update --params "{\"fileId\":\"$1\",\"addParents\":\"$2\",\"removeParents\":\"$cur\"}" >/dev/null 2>&1
}

# 1) pure: validate + build payloads (aborts non-zero on violations)
node scripts/build-payloads.mjs "$OUT"

# 2) I/O: project each node into kim-1/{namespace}/{doctype}/, persist manifest
: > "$SYNC_DIR/manifest.tsv.new"
while IFS=$'\t' read -r no name id visibility namespace doctype base; do
  [ -z "${no:-}" ] && continue
  nsfolder=$(ensure_folder "$FOLDER" "$namespace")
  dtfolder=$(ensure_folder "$nsfolder" "$doctype")
  found=$("$GWS" drive files list --params "$(cat "$base.q.json")" --format json 2>/dev/null | jget '(j=JSON.parse(d),j.files&&j.files[0]&&j.files[0].id)||""')
  if [ -n "$found" ]; then
    sid="$found"
    "$GWS" sheets spreadsheets values clear --params "{\"spreadsheetId\":\"$sid\",\"range\":\"A1:Z2000\"}" >/dev/null 2>&1
    echo "  ~ $namespace/$doctype/$name ($sid)"
  else
    sid=$("$GWS" sheets spreadsheets create --json "$(cat "$base.create.json")" --format json 2>/dev/null | jget '(JSON.parse(d)).spreadsheetId||""')
    echo "  + $namespace/$doctype/$name ($sid)"
  fi
  [ -z "$sid" ] && { echo "  !! $name: no spreadsheetId" >&2; exit 1; }
  place "$sid" "$dtfolder"
  "$GWS" sheets spreadsheets values update \
    --params "{\"spreadsheetId\":\"$sid\",\"range\":\"A1\",\"valueInputOption\":\"RAW\"}" \
    --json "$(cat "$base.values.json")" >/dev/null 2>&1
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$no" "$name" "$id" "$visibility" "$namespace" "$doctype" "$sid" >> "$SYNC_DIR/manifest.tsv.new"
done < "$OUT/plan.tsv"

mv "$SYNC_DIR/manifest.tsv.new" "$SYNC_DIR/manifest.tsv"
echo "✔ sync complete → $SYNC_DIR/manifest.tsv"
