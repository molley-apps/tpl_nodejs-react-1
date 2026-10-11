#!/usr/bin/env bash
# Run terraform for one environment.
#
#   TF_STATE_BUCKET=<state bucket> deploy/tf.sh dev plan
#   TF_STATE_BUCKET=<state bucket> deploy/tf.sh prod apply
#
# TF_STATE_BUCKET is a GCS bucket you create once to hold state (deploy/README.md).
# Each environment gets its own prefix inside it, so dev and prod never share state.
set -euo pipefail

env_name="${1:-}"
command="${2:-plan}"
shift 2 2>/dev/null || true

if [[ "${env_name}" != "dev" && "${env_name}" != "prod" ]]; then
  echo "usage: TF_STATE_BUCKET=<bucket> $0 <dev|prod> <plan|apply|destroy|output|...> [terraform args]" >&2
  exit 1
fi
if [[ -z "${TF_STATE_BUCKET:-}" ]]; then
  echo "TF_STATE_BUCKET must name the GCS bucket that holds terraform state" >&2
  exit 1
fi

cd "$(dirname "$0")/terraform"

terraform init -input=false -reconfigure \
  -backend-config="bucket=${TF_STATE_BUCKET}" \
  -backend-config="prefix=${env_name}" >/dev/null

case "${command}" in
  plan|apply|destroy)
    exec terraform "${command}" -input=false -var-file="envs/${env_name}.tfvars" "$@"
    ;;
  *)
    exec terraform "${command}" "$@"
    ;;
esac
