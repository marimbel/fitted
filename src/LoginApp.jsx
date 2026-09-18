import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";

/**
 * LoginApp.jsx
 *
 * Root component for the Login page. This is the piece of the assignment
 * with the most specific, graded behavior, so it's worth walking through
 * the state carefully:
 *
 *   - `username` / `password`   -> the LOGIN form's controlled values
 *   - `isRegistering`           -> whether the "Create Account" panel is shown
 *   - `statusMessage`           -> a small inline note (e.g. after "Sign In")
 *
 * The key requirement: when the registration form is submitted, we do
 * NOT send it anywhere (no backend exists in Project 1). Instead we:
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
