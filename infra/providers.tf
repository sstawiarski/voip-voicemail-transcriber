locals {
  region = "us-central1"
}

provider "google" {
  credentials = "../creds.json"
  project = var.project
  region = local.region
}