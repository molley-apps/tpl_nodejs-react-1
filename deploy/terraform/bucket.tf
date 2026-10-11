# The built frontends, one folder per app (users/, admin/, ...). Private: the
# API streams the files out with its service account, nothing is reachable on
# storage.googleapis.com. See apis/api-mono/api/docs/FRONTEND_ASSETS.md.
resource "google_storage_bucket" "assets" {
  # Bucket names are global, so the project id keeps "<env>-<app_name>" from
  # colliding with someone else's.
  name                        = "${var.project_id}-${local.name}"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = var.bucket_force_destroy

  versioning {
    enabled = false
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "api_reader" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.api.email}"
}
