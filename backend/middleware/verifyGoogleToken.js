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
 * The frontend sends the ID token as a normal bearer token:
 *   Authorization: Bearer <idToken>
 *
 * Note this is a DIFFERENT token from the Google OAuth *access* token
 * used for the Photos Picker API (see services/googlePhotosService.js).
 * The ID token says "who is this person" (verified here); the access
 * token says "this app may call the Photos Picker API on their behalf"
 * and is sent separately in the request body for the photos routes.
 */
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

export async function verifyGoogleToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <idToken> header" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // `sub` is Google's stable, unique id for this account — this is what
    // every Firestore path uses as {uid}, never the email (emails can
    // change; sub never does).
    req.user = {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired Google ID token" });
  }
}
