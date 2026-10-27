/**
 * config/firestore.js
 *
 * Single shared Firestore client for the whole backend. Import
 * `db` from here anywhere you need to read/write — don't create a new
 * Firestore() instance per file.
 *
 * Collection layout (per the proposal response), everything scoped
 * under one user:
 *   users/{uid}/photoAnalyses/{analysisId}  - Gemini's read of an uploaded photo
 *   users/{uid}/styleRequests/{requestId}   - Gemini's parse of a voice request
 *   users/{uid}/savedLooks/{lookId}         - looks the user saved from the Fitting Room
 *
 * TODO: on Cloud Run, Application Default Credentials (the service
 * account Cloud Run runs as) are enough — no key file needed there.
 * Locally, run `gcloud auth application-default login` once so this
 * works the same way on your machine.
 */
import { Firestore } from "@google-cloud/firestore";

export const db = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});
