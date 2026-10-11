#!/usr/bin/env sh
# Build the site locally and publish it to the `gh-pages` branch.
#
# The build stays local by design: this repo does not build on GitHub Actions.
# The deploy pushes the prebuilt `apps/web/dist` to the Pages branch. Configure
# GitHub Pages (Settings → Pages) to serve from the `gh-pages` branch, root folder.
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/.." && pwd)"    # apps/web
REPO="$(cd "$WEB/../.." && pwd)" # repo root
DIST="$WEB/dist"

cd "$REPO"
bun run web:build

REMOTE="$(git remote get-url origin)"
NAME="$(git config user.name || echo deploy)"
EMAIL="$(git config user.email || echo deploy@localhost)"

cd "$DIST"
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="$NAME" -c user.email="$EMAIL" commit -q -m "deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "$REMOTE" gh-pages
rm -rf .git

echo "Published $DIST to 'gh-pages' on $REMOTE"
