#!/usr/bin/env bash
# Build the API image, push it to the environment's registry and roll the
# Cloud Run service onto it.
#
#   TF_STATE_BUCKET=<state bucket> deploy/push-api.sh dev
#
# The image tag is api:latest in both environments (each has its own
# registry), which is also what api_image in the tfvars points at, so a later
# terraform apply sees no drift. Pass a second argument to tag a specific
# version as well, eg deploy/push-api.sh prod 1.4.0.
set -euo pipefail

env_name="${1:-}"
version="${2:-}"
here="$(cd "$(dirname "$0")" && pwd)"

if [[ "${env_name}" != "dev" && "${env_name}" != "prod" ]]; then
  echo "usage: TF_STATE_BUCKET=<bucket> $0 <dev|prod> [version]" >&2
  exit 1
fi

repository="$("${here}/tf.sh" "${env_name}" output -raw image_repository)"
service="$("${here}/tf.sh" "${env_name}" output -raw service_name)"
region="$(sed -n 's/^region *= *"\(.*\)"/\1/p' "${here}/terraform/envs/${env_name}.tfvars")"
project="$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' "${here}/terraform/envs/${env_name}.tfvars")"
image="${repository}/api"

gcloud auth configure-docker "${region}-docker.pkg.dev" --quiet

docker build --platform linux/amd64 --target runtime -t "${image}:latest" "${here}/../apis/api-mono/api"
docker push "${image}:latest"

if [[ -n "${version}" ]]; then
  docker tag "${image}:latest" "${image}:${version}"
  docker push "${image}:${version}"
fi

gcloud run deploy "${service}" \
  --image="${image}:latest" \
  --region="${region}" \
  --project="${project}" \
  --quiet

echo
echo "Deployed ${image}:latest to ${service}."
echo "If api_image in envs/${env_name}.tfvars is still empty, set it to \"${image}:latest\" and apply once:"
echo "  the service then gets the /readyz startup probe instead of the bootstrap TCP check."
