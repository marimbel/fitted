import { useEffect, useRef, useState } from "react";
import "../styles/google-auth.css";

/**
 * GoogleSignInButton.jsx
 *
 * Shows a Fitted-styled "Sign in with Google" button. Clicking it pops
 * open a small modal with Google's own official sign-in button inside
 * (mounted into `buttonRef` by useGoogleAuth.js) -- Google's button is
 * what actually starts the sign-in flow (it opens its own OAuth popup
 * when clicked), this component just keeps it out of the page's normal
 * flow until the user asks for it, instead of a wide embedded Google
 * widget sitting inline in the layout.
 *
 * The modal's backdrop (`.google-auth-modal-backdrop`) is always in the
 * DOM -- only hidden/shown with a CSS class -- rather than conditionally
 * rendered with `{isOpen && ...}`. That matters here: useGoogleAuth.js
 * calls `google.accounts.id.renderButton(buttonRef.current, ...)` once,
 * on mount. If the div holding `buttonRef` didn't exist in the DOM yet
 * the first time that runs (because the modal was still closed), the
 * button would never get rendered at all.
 *
 * Once signed in (and once Photos access is granted/declined), the
 * same panel instead shows who's signed in and a sign-out button.
 *
 * Props:
 *   auth - the whole object returned by useGoogleAuth()
 */
export default function GoogleSignInButton({ auth }) {
  const { buttonRef, isSignedIn, profile, accessToken, requestPhotosAccess, signOut } = auth;
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  function closeModal() {
    triggerRef.current?.focus();
    setIsOpen(false);
  }

  // Close the modal automatically once sign-in actually succeeds, so
  // the user doesn't have to dismiss it themselves after choosing an
  // account in Google's popup.
  useEffect(() => {
    if (isSignedIn) setIsOpen(false);
  }, [isSignedIn]);

  return (
    <div className="google-auth-panel">
      {!isSignedIn ? (
        <>
          <button ref={triggerRef} type="button" className="btn-fitted btn-dark w-100" onClick={() => setIsOpen(true)}>
            Sign in with Google
          </button>

          <div
            className={`google-auth-modal-backdrop${isOpen ? " is-open" : ""}`}
            onClick={closeModal}
            aria-hidden={!isOpen}
          >
            <div className="google-auth-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="google-auth-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
              <p className="google-auth-modal-title">Sign in to Fitted</p>
              <div ref={buttonRef}></div>
            </div>
          </div>
        </>
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
