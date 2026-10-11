terraform {
  required_version = "~> 1.14"

  # State lives in a GCS bucket you create once per project (see deploy/README.md).
  # The bucket and the per-environment prefix are passed at init time by deploy/tf.sh:
  #   terraform init -backend-config="bucket=<state bucket>" -backend-config="prefix=<env>"
  backend "gcs" {}

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.29"
    }
  }
}
