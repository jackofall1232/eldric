#!/usr/bin/env bash
# Build the installable WordPress plugin zip for Eldric: The Living Chronicle.
#
# Produces build/eldric-living-chronicle-<version>.zip whose root folder is
# living-chronicle/ (so WordPress installs it as wp-content/plugins/living-chronicle/).
# Includes assets/build; excludes source maps and node_modules.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.1.0"
ZIP_NAME="eldric-living-chronicle-${VERSION}.zip"
OUT_DIR="${REPO_ROOT}/build"
OUT_ZIP="${OUT_DIR}/${ZIP_NAME}"
PLUGIN_DIR="${REPO_ROOT}/wordpress/living-chronicle"

echo "==> Building browser bundle (npm run build:wp)"
cd "${REPO_ROOT}"
npm run build:wp

if [[ ! -f "${PLUGIN_DIR}/assets/build/eldric-living-chronicle.js" ]]; then
    echo "error: expected ${PLUGIN_DIR}/assets/build/eldric-living-chronicle.js after build" >&2
    exit 1
fi

echo "==> Creating ${OUT_ZIP}"
mkdir -p "${OUT_DIR}"
rm -f "${OUT_ZIP}"
cd "${REPO_ROOT}/wordpress"
zip -r -q "${OUT_ZIP}" living-chronicle \
    -x 'living-chronicle/**/*.map' \
    -x 'living-chronicle/*.map' \
    -x 'living-chronicle/node_modules/*' \
    -x 'living-chronicle/**/node_modules/*' \
    -x 'living-chronicle/**/.DS_Store' \
    -x 'living-chronicle/.DS_Store'

echo "==> Verifying zip contents"
LISTING="$(unzip -l "${OUT_ZIP}")"
if ! grep -q 'living-chronicle/living-chronicle\.php' <<< "${LISTING}"; then
    echo "error: living-chronicle/living-chronicle.php missing from zip" >&2
    exit 1
fi
if grep -q '\.map' <<< "${LISTING}"; then
    echo "error: source map files leaked into zip" >&2
    exit 1
fi
if grep -q 'node_modules' <<< "${LISTING}"; then
    echo "error: node_modules leaked into zip" >&2
    exit 1
fi

echo "==> OK: ${OUT_ZIP}"
tail -n 2 <<< "${LISTING}"
