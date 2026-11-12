import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import GoogleSignInButton from "./components/GoogleSignInButton.jsx";
import { useGoogleAuth } from "./hooks/useGoogleAuth.js";

/**
 * LoginApp.jsx
 *
 * Root component for the Login page. Two separate sign-in experiences
 * live here, intentionally kept apart:
 *
 *   1. Google Sign-In (useGoogleAuth, same hook the Fitting Room uses)
 *      -- Fitted's REAL authentication. Signing in here is saved to
 *      localStorage (see services/authSession.js) so it's already
 *      active when the user navigates to Try Fitted, without having
 *      to sign in a second time.
 *   2. The simulated username/password + Create Account flow below it
 *      -- a Project 1 course requirement, never connected to a real
 *      backend on purpose (see the state notes below). Kept exactly
 *      as originally built so that graded behavior doesn't change.
 *
 *   - `username` / `password`   -> the LOGIN form's controlled values
 *   - `isRegistering`           -> whether the "Create Account" panel is shown
 *   - `statusMessage`           -> a small inline note (e.g. after "Sign In")
 *
 * The key requirement for the simulated flow: when the registration
 * form is submitted, we do NOT send it anywhere (no backend exists in
 * Project 1). Instead we:
 *   1. hide the registration form,
 *   2. copy the new account's username/password into the LOGIN form's
 *      state, so the fields the user just filled in on the right
 *      immediately reappear, pre-filled, on the left.
 */
export default function LoginApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Fitted's real authentication -- independent of the simulated form
  // below. A session saved here (or restored from an earlier sign-in
  // on another page) is what Try Fitted's Google Sign-In panel reads
  // too, via the same localStorage-backed session in authSession.js.
  const auth = useGoogleAuth();

  function handleAccountCreated(newAccount) {
    // Copy the freshly "created" credentials into the login form's state.
    setUsername(newAccount.username);
    setPassword(newAccount.password);

    // Hide the registration form and return to the single login form.
    setIsRegistering(false);

    setStatusMessage(`Account created for ${newAccount.name}. Your details have been filled in below.`);
  }

  function handleLoginSubmit() {
    // No real authentication exists yet in Project 1 — this simply
    // confirms the form works. PROJECT 2: replace with a real request
    // to an authentication API.
    setStatusMessage(username ? `Welcome back, ${username}. (Sign-in isn't connected yet.)` : "Enter a username and password to continue.");
  }

  return (
    <div>
      <Navbar activePage="login" />

      <div className="container-fitted auth-shell">
        {/* ---- Real authentication: Google Sign-In ---- */}
        <div className="auth-card google-auth-card">
          <h2 className="h5">Sign in with Google</h2>
          <p className="auth-subtext">
            Fitted's real sign-in — used to save your looks and connect Google Photos in the
            Fitting Room. Carries over automatically once you're signed in here.
          </p>
          <GoogleSignInButton auth={auth} />
          {auth.isSignedIn && (
            <a href="/app.html" className="btn-fitted btn-dark w-100 mt-3">
              Continue to Try Fitted →
            </a>
          )}
        </div>

        <div className="auth-divider">
          <span>or use the demo login below</span>
        </div>

        {/* ---- Simulated login/register flow: a Project 1 course requirement,
             intentionally not connected to a backend. See the component doc
             comment above for exactly why. ---- */}
        <div className={`auth-layout${isRegistering ? " is-registering" : ""}`}>
          <LoginForm
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleLoginSubmit}
            onShowRegister={() => {
              setIsRegistering(true);
              setStatusMessage("");
            }}
          />

          {/* The registration panel only renders while isRegistering is true.
              Because it appears to the RIGHT of the login form in the same
              flex/grid row, and the two forms share the .auth-layout
              container, this satisfies the "display to the right on
              desktop" requirement while still stacking naturally on
              mobile widths (see login.css). */}
          {isRegistering && (
            <RegisterForm onAccountCreated={handleAccountCreated} onCancel={() => setIsRegistering(false)} />
          )}
        </div>

        {statusMessage && <div className="auth-status-message">{statusMessage}</div>}
      </div>
    </div>
  );
}
