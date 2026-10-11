# One Secret Manager secret per entry of local.secrets, injected into the
# container as the env var named there. Values are written by Terraform too,
# so nobody opens the console:
#
#   - the auth secret is generated here (random_password) and never seen by anyone
#   - the Mongo and email values come from the mongo_* / email_password variables
#     (TF_VAR_* from Molley's provisioner, or a gitignored *.secrets.auto.tfvars)
#
# The versions use write-only arguments, so the values never land in state;
# only the generated auth secret does, as the random_password resource.
#
# Write-only values are not compared between applies: a version is written
# when var.secrets_version changes and left alone otherwise. So an apply that
# changes scaling or env vars needs no secret values at all, and rotating one
# is "new value, bump secrets_version, apply". Every secret is rewritten at a
# bump, so provide all of them then; one left empty gets a placeholder.

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
  for_each = local.secrets

  secret                 = google_secret_manager_secret.api[each.key].id
  secret_data_wo         = lookup(local.secret_values, each.key, "REPLACE_ME")
  secret_data_wo_version = var.secrets_version
}

resource "google_secret_manager_secret_iam_member" "api_accessor" {
  for_each = local.secrets

  secret_id = google_secret_manager_secret.api[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}
