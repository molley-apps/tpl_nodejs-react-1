# The identity the API runs as. It gets exactly three things: write logs and
# traces, read the assets bucket (bucket.tf) and read its secrets (secrets.tf).
resource "google_service_account" "api" {
  account_id   = local.name
  display_name = "${var.app_name} API (${var.env})"

  depends_on = [google_project_service.required]
}

resource "google_project_iam_member" "api" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/cloudtrace.agent",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.api.email}"
}
