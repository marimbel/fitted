/**
 * GoogleSignInButton.jsx
 *
 * Renders Google's own "Sign in with Google" button (mounted into
 * `buttonRef` by useGoogleAuth.js) and, once signed in, shows who's
 * signed in plus a button to grant Google Photos access — a second,
 * separate consent step, since sign-in and Photos access are two
 * different scopes/tokens (see useGoogleAuth.js).
 *
 * Props:
 *   auth - the whole object returned by useGoogleAuth()
 */
export default function GoogleSignInButton({ auth }) {
  const { buttonRef, isSignedIn, profile, accessToken, requestPhotosAccess, signOut } = auth;

  return (
    <div className="google-auth-panel">
      {!isSignedIn ? (
        <div ref={buttonRef}></div>
      ) : (
        <div className="google-auth-signed-in">
          <p className="google-auth-profile">
            Signed in as <strong>{profile?.name || profile?.email}</strong>
          </p>
          <div className="google-auth-actions">
            {!accessToken && (
              <button type="button" className="btn-fitted btn-outline btn-sm" onClick={requestPhotosAccess}>
                Grant Google Photos access
              </button>
            )}
            <button type="button" className="btn-fitted btn-outline btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
