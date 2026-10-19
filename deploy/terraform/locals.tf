locals {
  name = "${var.env}-${var.app_name}"

  labels = {
    app       = var.app_name
    env       = var.env
    managedby = "terraform"
  }

  # First apply: the registry is created in this same run, so no image of ours
  # can exist yet. A public hello container stands in until push-api.sh has
  # pushed the real one and api_image is set.
  bootstrap = var.api_image == ""
  image     = local.bootstrap ? "us-docker.pkg.dev/cloudrun/container/hello" : var.api_image

  # Secret id suffix => env var the container reads it as. Add a line here (and
  # a value below) to add a secret; secrets.tf creates it and grants access.
  secrets = {
    mongo-host     = "MONGO_HOST"
    mongo-user     = "MONGO_USER"
    mongo-password = "MONGO_PW"
    auth-secret    = "AUTH_SECRET"
    email-password = "EMAIL_PASSWORD"
    # One-time key that makes the first signed-in user the administrator (API: POST /api/setup/admin). Molley reads
    # it from the admin_setup_key output and shows the claim link on the Launchpad; useless once an admin exists.
    admin-setup-key = "ADMIN_SETUP_KEY"
  }

  # The values to write. The auth secret is always generated here; the rest
  # come from the variables. An empty one is left out, so secrets.tf writes a
  # placeholder for it at the first apply (or at a secrets_version bump).
  secret_values = {
    for id, value in {
      mongo-host      = var.mongo_host
      mongo-user      = var.mongo_user
      mongo-password  = var.mongo_password
      auth-secret     = random_password.auth_secret.result
      email-password  = var.email_password
      admin-setup-key = random_password.admin_setup_key.result
    } : id => value if value != ""
  }

  # Plain env vars the API needs. var.env_vars is merged last so it can override.
  # MONGO_DB is required: without it the API falls back to its package name as
  # the database, which the per-environment Atlas user has no rights on.
  env_vars = merge(
    {
      NODE_ENV             = "production"
      APP_NAME             = var.app_display_name
      MONGO_DB             = var.mongo_database != "" ? var.mongo_database : var.env
      AUTH_TRUSTED_ORIGINS = join(",", var.auth_trusted_origins)
      GCS_FRONTEND_BUCKET  = google_storage_bucket.assets.name
      GCS_BASE_URL         = "https://storage.googleapis.com"
      EMAIL_MODE           = "NODEMAILER"
      EMAIL_HOST           = var.email.host
      EMAIL_PORT           = tostring(var.email.port)
      EMAIL_USERNAME       = var.email.username
      EMAIL_FALLBACK_FROM  = var.email.from
      EMAIL_SUPPORT        = var.email.from
      TRUST_PROXY_HOPS     = "1"
      FRONTENDS_NOINDEX    = tostring(var.noindex)
      # Scheduled jobs: the API manages its own Cloud Scheduler jobs (sa.tf)
      GCP_PROJECT_ID          = var.project_id
      GCP_REGION              = var.region
      SCHEDULER_INVOKER_EMAIL = google_service_account.scheduler_invoker.email
    },
    # Behind a proxy or custom hostname the Host header the API sees is not the
    # public one, so Better Auth is told the public origin explicitly too.
    var.app_url == "" ? {} : { APP_URL = var.app_url, AUTH_BASE_URL = var.app_url },
    var.env_vars,
  )
}
