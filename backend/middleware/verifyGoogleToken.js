/**
 * middleware/verifyGoogleToken.js
 *
 * Verifies the Google ID token the frontend sends with each request
 * (from Google Identity Services sign-in) and attaches the verified user
 * info to req.user. One Google consent screen covers both sign-in and
 * the Photos Picker scope, so this is the only auth check the backend
 * needs — no separate Firebase Authentication service, per the proposal
 * review's simplification.
 *
 * TODO: implement. Rough shape:
 *
 *   import { OAuth2Client } from "google-auth-library";
 *   const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
 *
 *   export async function verifyGoogleToken(req, res, next) {
 *     const idToken = req.headers.authorization?.replace("Bearer ", "");
 *     if (!idToken) return res.status(401).json({ error: "Missing token" });
 *     try {
 *       const ticket = await client.verifyIdToken({
 *         idToken,
 *         audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
 *       });
 *       req.user = ticket.getPayload(); // includes sub (uid), email, name
 *       next();
 *     } catch (err) {
 *       res.status(401).json({ error: "Invalid token" });
 *     }
 *   }
 *
 * Apply this to every route under /api/photos, /api/audio, /api/looks
 * that needs to know which user is making the request (that's all of
 * them — every Firestore path is scoped to users/{uid}/...).
 */
export async function verifyGoogleToken(req, res, next) {
  // TODO: replace with the real implementation above once
  // GOOGLE_OAUTH_CLIENT_ID is set up in Google Cloud Console.
  res.status(501).json({ error: "verifyGoogleToken not implemented yet" });
}
