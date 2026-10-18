output "service_url" {
  description = "Public URL of the deployment. Put it in app_url (or map a custom domain) and apply again"
  value       = google_cloud_run_v2_service.api.uri
}

output "service_name" {
  value = google_cloud_run_v2_service.api.name
}

output "assets_bucket" {
  description = "Upload each frontend's dist/ into <bucket>/<app>/ (deploy/upload-frontends.sh)"
  value       = google_storage_bucket.assets.name
}

output "image_repository" {
  description = "Push the API image here as api:latest (deploy/push-api.sh)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}"
}

output "service_account" {
  value = google_service_account.api.email
}

output "scheduler_invoker" {
  description = "Service account Cloud Scheduler calls the API's job endpoint as"
  value       = google_service_account.scheduler_invoker.email
}

output "secrets" {
  description = "Secret Manager ids to fill in after the first apply"
  value       = [for secret in google_secret_manager_secret.api : secret.secret_id]
}

output "custom_domain_dns" {
  description = "DNS records to create for the custom domain (empty when none is mapped)"
  value = var.custom_domain == "" ? [] : [
    for record in google_cloud_run_domain_mapping.api[0].status[0].resource_records : {
      name  = record.name
      type  = record.type
      value = record.rrdata
    }
  ]
}
