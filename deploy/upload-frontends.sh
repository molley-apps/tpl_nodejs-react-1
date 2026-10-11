#!/usr/bin/env bash
# Build one or more frontend apps and upload them to the environment's assets
# bucket, where the API serves them from (apis/api-mono/api/docs/FRONTEND_ASSETS.md).
#
#   TF_STATE_BUCKET=<state bucket> deploy/upload-frontends.sh dev            # users and admin (the default list)
#   TF_STATE_BUCKET=<state bucket> deploy/upload-frontends.sh prod users     # one app only
#
# Each app is built with VITE_BASE_PATH=/<app>/ (the prefix the API serves it
# under, see FrontendAssetsService.frontendMap) and VITE_API_BASE_URL= (same
# origin). Only the app's own folder in the bucket is replaced, so the other
# apps keep serving meanwhile. Uploading is the whole frontend deploy: no API
# change or new revision is needed.
set -euo pipefail

env_name="${1:-}"
shift || true
apps=("$@")
if [[ ${#apps[@]} -eq 0 ]]; then
  apps=(users admin)
fi
here="$(cd "$(dirname "$0")" && pwd)"

if [[ "${env_name}" != "dev" && "${env_name}" != "prod" ]]; then
  echo "usage: TF_STATE_BUCKET=<bucket> $0 <dev|prod> [app ...]" >&2
  exit 1
fi

bucket="$("${here}/tf.sh" "${env_name}" output -raw assets_bucket)"

cd "${here}/../frontends"
pnpm install --frozen-lockfile

for app in "${apps[@]}"; do
  echo "== ${app}"
  (
    cd "${app}"
    VITE_BASE_PATH="/${app}/" VITE_API_BASE_URL="" NODE_ENV=production pnpm build
  )
  gsutil -m rm -r "gs://${bucket}/${app}/**" 2>/dev/null || true
  gsutil -m cp -r "${app}/dist/"* "gs://${bucket}/${app}/"
  echo "   gs://${bucket}/${app}/ updated, served at /${app}/"
done
