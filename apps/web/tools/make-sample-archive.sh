#!/usr/bin/env sh
# Build apps/web/public/samples/archive-demo.zip — the playground's demo archive
# (docs, csv, video, nested archive and office files).
#
# Requires python3, ffmpeg and zip. Run from anywhere:
#   sh apps/web/tools/make-sample-archive.sh
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/.." && pwd)"
OUT="$WEB/public/samples/archive-demo.zip"

STAGING="$(mktemp -d)"
NESTED_SRC="$(mktemp -d)"
trap 'rm -rf "$STAGING" "$NESTED_SRC"' EXIT

python3 "$HERE/sample_archive.py" "$STAGING" "$NESTED_SRC"

ffmpeg -y -loglevel error -f lavfi -i testsrc=size=160x120:rate=12:duration=2 \
  -pix_fmt yuv420p -c:v libx264 -movflags +faststart "$STAGING/media/clip.mp4"
ffmpeg -y -loglevel error -f lavfi -i testsrc=size=160x120:duration=1 \
  -frames:v 1 "$STAGING/media/photo.png"

# Nested archive: zip the inner files without leaving loose copies in the tree.
mkdir -p "$STAGING/nested"
(cd "$NESTED_SRC" && zip -q -X "$STAGING/nested/bundle.zip" inner-readme.md inner-data.csv)

mkdir -p "$WEB/public/samples"
# -FS syncs the archive with the tree (drops stale entries, updates the rest).
(cd "$STAGING" && zip -q -X -FS -r "$OUT" .)

echo "Wrote $OUT"
unzip -l "$OUT"
