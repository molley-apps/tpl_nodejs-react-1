# =============================================================================
# prod: protected from destroy, more headroom. Replace every CHANGEME.
# =============================================================================

project_id = "CHANGEME" # GCP project id (a different project from dev is recommended)
region     = "europe-west2"
env        = "prod"
app_name   = "CHANGEME" # eg my-app: resources are named prod-my-app

app_display_name = "CHANGEME" # eg My App

# After the first apply, copy the service_url output here (or set custom_domain) and apply again.
app_url       = ""
custom_domain = "" # eg app.example.com

# Leave empty for the first apply. After `deploy/push-api.sh prod`, set it to
# "<image_repository output>/api:latest" and apply again.
api_image = ""

# min 0 costs nothing while idle but adds a cold start to the first request
# after a quiet spell; set 1 once there are real users.
min_instance_count    = 0
max_instance_count    = 10
cpu                   = "1"
memory                = "1Gi"
container_concurrency = 80

deletion_protection  = true
bucket_force_destroy = false

noindex = false

# Secret values live in envs/prod.secrets.auto.tfvars (gitignored), see deploy/README.md.
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
  LOGGER_MODE = "log"
}
