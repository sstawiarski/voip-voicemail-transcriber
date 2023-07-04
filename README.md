# VOIP Voicemail Transcriber

This project is a serverless voicemail transcription application for using specifically with the [Voip.ms](https://voip.ms) VOIP API and built on Google Cloud Platform (GCP): Cloud Functions, Speech-to-Text, Secret Manager. It uses Terraform CDK for IaC and SendGrid Incoming Parse webhooks as a trigger for the function to call the Voip.ms API and begin the transcription process. After transcription is successful, alerts can be sent as email and/or push notification using the SendGrid and Pushover APIs, respectively.
