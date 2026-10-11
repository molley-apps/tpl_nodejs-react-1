# Where deploy/push-api.sh pushes the API image. One repository per
# environment, so dev and prod images never share a tag.
resource "google_artifact_registry_repository" "api" {
  location      = var.region
  repository_id = local.name
  format        = "DOCKER"
  description   = "${var.app_name} API images (${var.env})"

  # Keep the ten most recent images; old revisions can still be rolled back to.
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 days
    }
  }

  depends_on = [google_project_service.required]
}
