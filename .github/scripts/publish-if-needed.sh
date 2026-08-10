#!/usr/bin/env bash
set -euo pipefail

PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
TAG="v${PACKAGE_VERSION}"
REGISTRY="https://registry.npmjs.org"
export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

recover_release_state() {
  if ! git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
    echo "${PACKAGE_NAME}@${PACKAGE_VERSION} is already on npm; recovering missing ${TAG}."
    echo "New tag: ${TAG}"
    return
  fi

  if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "${PACKAGE_NAME}@${PACKAGE_VERSION} is already published and released; nothing to do."
    return
  fi

  notes_file="${RUNNER_TEMP:-/tmp}/release-notes-${PACKAGE_VERSION}.md"
  awk -v version="${PACKAGE_VERSION}" '
    $0 == "## " version { found = 1; next }
    found && /^## / { exit }
    found { print }
  ' CHANGELOG.md > "${notes_file}"
  gh release create "${TAG}" --title "${TAG}" --notes-file "${notes_file}"
  echo "Recovered missing GitHub release ${TAG}."
}

published_version="$(npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version --registry="${REGISTRY}" 2>/dev/null || true)"
if [[ "${published_version}" == "${PACKAGE_VERSION}" ]]; then
  recover_release_state
  exit 0
fi

set +e
publish_output="$(bunx changeset publish 2>&1)"
publish_status=$?
set -e
printf '%s\n' "${publish_output}"

if [[ ${publish_status} -eq 0 ]]; then
  exit 0
fi
if grep -Fq "You cannot publish over the previously published versions: ${PACKAGE_VERSION}" <<<"${publish_output}"; then
  recover_release_state
  exit 0
fi
exit "${publish_status}"
