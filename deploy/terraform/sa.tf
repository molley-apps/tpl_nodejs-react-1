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

# Scheduled jobs (apis/api-mono/api/src/jobs). The API creates one Cloud
# Scheduler job per enabled schedule at runtime, so it needs to administer
# Scheduler jobs in this project and to mint OIDC tokens as the invoker account
# below, which is the identity the jobs call the API back with. Nothing per job
# lives in Terraform: schedules are edited in the app's admin area.
resource "google_service_account" "scheduler_invoker" {
  # Account ids are capped at 30 characters; the app name alone may be 25.
  account_id   = trimsuffix(substr("${local.name}-sched", 0, 30), "-")
  display_name = "${var.app_name} scheduler invoker (${var.env})"

  depends_on = [google_project_service.required]
}

resource "google_project_iam_member" "api_scheduler_admin" {
  project = var.project_id
  role    = "roles/cloudscheduler.admin"
  member  = "serviceAccount:${google_service_account.api.email}"
}

resource "google_service_account_iam_member" "api_uses_scheduler_invoker" {
  service_account_id = google_service_account.scheduler_invoker.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.api.email}"
}
