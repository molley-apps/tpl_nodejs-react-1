# ---------------------------------------------------------------------------
# Where
# ---------------------------------------------------------------------------

variable "project_id" {
  description = "GCP project the environment is created in"
  type        = string
}

variable "region" {
  description = "Region for Cloud Run, Artifact Registry and the assets bucket"
  type        = string
  default     = "europe-west2"
}

variable "env" {
  description = "Environment name, prefixes every resource name (dev-<app_name>, prod-<app_name>)"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "env must be dev or prod"
  }
}

variable "app_name" {
  description = "Short DNS-safe product name, eg my-app. Used in every resource name"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,28}[a-z0-9]$", var.app_name))
    error_message = "app_name must be lowercase letters, digits and hyphens, 3 to 30 characters"
  }
}

# ---------------------------------------------------------------------------
# The API container
# ---------------------------------------------------------------------------

variable "api_image" {
  description = <<-EOT
    Image the service runs, eg europe-west2-docker.pkg.dev/<project>/<env>-<app_name>/api:latest.
    Leave empty for the very first apply: the registry does not exist yet, so a public
    placeholder image is deployed with a TCP probe. Push the real image (deploy/push-api.sh),
    set this, and apply again.
  EOT
  type        = string
  default     = ""
}

variable "min_instance_count" {
  description = "0 scales to zero when idle (nothing to pay for); 1 keeps one instance warm"
  type        = number
  default     = 0
}

variable "max_instance_count" {
  type    = number
  default = 3
}

variable "cpu" {
  type    = string
  default = "1"
}

variable "memory" {
  type    = string
  default = "512Mi"
}

variable "container_concurrency" {
  description = "Requests one instance handles at once before Cloud Run scales out"
  type        = number
  default     = 80
}

variable "request_timeout_seconds" {
  type    = number
  default = 300
}

variable "deletion_protection" {
  description = "Refuse to destroy the Cloud Run service; true for prod"
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# What the API is told about itself
# ---------------------------------------------------------------------------

variable "app_display_name" {
  description = "APP_NAME: shown in emails, the auth app name and the 403 page"
  type        = string
}

variable "app_url" {
  description = <<-EOT
    APP_URL: the public origin, used in emails. Empty on the first apply (the Cloud Run URL
    is only known afterwards): copy the `service_url` output here, or your custom domain,
    and apply again.
  EOT
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Optional domain to map to the service, eg app.example.com. Add the CNAME the `custom_domain_dns` output tells you"
  type        = string
  default     = ""
}

variable "auth_trusted_origins" {
  description = "Extra browser origins allowed to sign in. The API serves the frontends from its own origin, which is always trusted, so normally empty"
  type        = list(string)
  default     = []
}

variable "email" {
  description = "Outgoing email. The password is a secret (see secrets.tf), everything else is plain config"
  type = object({
    host     = string
    port     = number
    username = string
    from     = string
  })
  default = {
    host     = "smtp.sendgrid.net"
    port     = 587
    username = "apikey"
    from     = "no-reply@example.com"
  }
}

variable "env_vars" {
  description = "Any extra plain-text env vars for the container (use secrets.tf for secrets)"
  type        = map(string)
  default     = {}
}

variable "noindex" {
  description = "Send X-Robots-Tag: noindex on every frontend response, so search engines skip this environment (dev)"
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# Secret values. Never commit them: a developer puts them in a gitignored
# envs/<env>.secrets.auto.tfvars, Molley's provisioner passes them as TF_VAR_*.
# They are written to Secret Manager with write-only arguments and never land
# in the state file. Leave one empty and its secret keeps a placeholder value.
# ---------------------------------------------------------------------------

variable "mongo_host" {
  description = "Atlas SRV hostname, eg cluster0.abcde.mongodb.net (no scheme)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "mongo_user" {
  type      = string
  default   = ""
  sensitive = true
}

variable "mongo_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "email_password" {
  description = "Password or API key for the SMTP user in var.email"
  type        = string
  default     = ""
  sensitive   = true
}

variable "secrets_version" {
  description = "Bump by one whenever a secret value above changes, so a new Secret Manager version is written"
  type        = number
  default     = 1
}

# ---------------------------------------------------------------------------
# Assets bucket
# ---------------------------------------------------------------------------

variable "bucket_force_destroy" {
  description = "Allow terraform destroy to delete the bucket with its objects; false for prod"
  type        = bool
  default     = true
}
