# One Secret Manager secret per entry of local.secrets, injected into the
# container as the env var named there. Each is seeded with a placeholder so
# the first apply succeeds; set the real values afterwards (deploy/README.md):
#
#   printf '%s' 'the value' | gcloud secrets versions add <env>-<app_name>-<id> --data-file=- --project=<project>
#
# Terraform never reads the values back (ignore_changes), so rotating a secret
# is a gcloud command, not a tfvars edit.
resource "google_secret_manager_secret" "api" {
  for_each = local.secrets

  secret_id = "${local.name}-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "placeholder" {
  for_each = local.secrets

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
