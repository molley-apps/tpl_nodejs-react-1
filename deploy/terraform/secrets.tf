# One Secret Manager secret per entry of local.secrets, injected into the
# container as the env var named there. Values are written by Terraform too,
# so nobody opens the console:
#
#   - the auth secret is generated here (random_password) and never seen by anyone
#   - the Mongo and email values come from the mongo_* / email_password variables
#     (TF_VAR_* from Molley's provisioner, or a gitignored *.secrets.auto.tfvars)
#
# The versions use write-only arguments, so the values never land in state;
# only the generated auth secret does, as the random_password resource. Bump
# var.secrets_version to write a new version after changing a value. A secret
# whose value is not provided keeps a placeholder so the first apply succeeds.

resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

resource "google_secret_manager_secret" "api" {
  for_each = local.secrets

  secret_id = "${local.name}-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "value" {
  for_each = local.secret_values

  secret                 = google_secret_manager_secret.api[each.key].id
  secret_data_wo         = each.value
  secret_data_wo_version = var.secrets_version
}

resource "google_secret_manager_secret_version" "placeholder" {
  for_each = { for id in keys(local.secrets) : id => id if !contains(keys(local.secret_values), id) }

  secret      = google_secret_manager_secret.api[each.key].id
  secret_data = "REPLACE_ME"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

resource "google_secret_manager_secret_iam_member" "api_accessor" {
  for_each = local.secrets

  secret_id = google_secret_manager_secret.api[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}
