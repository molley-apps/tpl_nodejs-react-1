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
  }

  # The values to write. The auth secret is always generated here; the rest
  # come from the variables and are skipped while empty (placeholder stays).
  secret_values = {
    for id, value in {
      mongo-host     = var.mongo_host
      mongo-user     = var.mongo_user
      mongo-password = var.mongo_password
      auth-secret    = random_password.auth_secret.result
      email-password = var.email_password
    } : id => value if value != ""
  }

  # Plain env vars the API needs. var.env_vars is merged last so it can override.
  env_vars = merge(
    {
      NODE_ENV             = "production"
      APP_NAME             = var.app_display_name
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
    },
    var.app_url == "" ? {} : { APP_URL = var.app_url },
    var.env_vars,
  )
}
