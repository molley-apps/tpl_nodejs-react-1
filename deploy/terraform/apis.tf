# Google APIs the environment needs. Left enabled on destroy so tearing down
# one environment never breaks another in the same project.
resource "google_project_service" "required" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "iam.googleapis.com",
    "cloudscheduler.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
