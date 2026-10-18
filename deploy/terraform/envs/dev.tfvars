# =============================================================================
# dev: scale to zero, small, destroyable. Replace every CHANGEME.
# =============================================================================

project_id = "CHANGEME" # GCP project id
region     = "europe-west2"
env        = "dev"
app_name   = "CHANGEME" # eg my-app: resources are named dev-my-app

app_display_name = "CHANGEME" # eg My App

# After the first apply, copy the service_url output here (or set custom_domain) and apply again.
app_url       = ""
custom_domain = ""

# Leave empty for the first apply. After `deploy/push-api.sh dev`, set it to
# "<image_repository output>/api:latest" and apply again.
api_image = ""

min_instance_count    = 0
max_instance_count    = 2
cpu                   = "1"
memory                = "512Mi"
container_concurrency = 80

deletion_protection  = false
bucket_force_destroy = true

# Keep search engines out of the dev environment
noindex = true

# Secret values live in envs/dev.secrets.auto.tfvars (gitignored), see deploy/README.md.
# Bump when a value there changes:
secrets_version = 1

# Fallback only: the administrator connects the real email provider in the admin app (Settings → Email).
email = {
  host     = "smtp.sendgrid.net"
  port     = 587
  username = "apikey"
  from     = "no-reply@example.com"
}

env_vars = {
  LOGGER_MODE = "verbose"
}
