# The one Cloud Run service: it serves /api and streams the frontends from the
# assets bucket, so it is the whole deployment. Public ingress; Better Auth
# inside the API decides who gets data.
resource "google_cloud_run_v2_service" "api" {
  name                = local.name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.deletion_protection

  template {
    service_account                  = google_service_account.api.email
    timeout                          = "${var.request_timeout_seconds}s"
    max_instance_request_concurrency = var.container_concurrency

    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = local.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.secrets
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.api[env.key].secret_id
              version = "latest"
            }
          }
        }
      }

      # Startup: the API opens its port BEFORE Mongo is connected (server.ts),
      # so traffic is gated on /readyz, which only returns 200 once the
      # connection is up. The bootstrap placeholder has no such route, so it
      # gets a plain TCP check instead.
      startup_probe {
        initial_delay_seconds = 5
        period_seconds        = 5
        timeout_seconds       = 3
        failure_threshold     = 24

        dynamic "tcp_socket" {
          for_each = local.bootstrap ? [1] : []
          content {
            port = 8080
          }
        }

        dynamic "http_get" {
          for_each = local.bootstrap ? [] : [1]
          content {
            path = "/readyz"
            port = 8080
          }
        }
      }

      # Liveness: is express answering at all.
      dynamic "liveness_probe" {
        for_each = local.bootstrap ? [] : [1]
        content {
          http_get {
            path = "/api/health"
            port = 8080
          }
          initial_delay_seconds = 10
          period_seconds        = 30
          timeout_seconds       = 3
          failure_threshold     = 3
        }
      }
    }
  }

  depends_on = [
    google_project_iam_member.api,
    google_storage_bucket_iam_member.api_reader,
    google_secret_manager_secret_version.placeholder,
    google_secret_manager_secret_iam_member.api_accessor,
  ]
}

# Anyone can reach the service; the API enforces its own sessions.
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Optional custom domain. Cloud Run provisions the certificate once the DNS
# record from the `custom_domain_dns` output is in place.
resource "google_cloud_run_domain_mapping" "api" {
  count = var.custom_domain == "" ? 0 : 1

  name     = var.custom_domain
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }
}
