import { useState } from "react";

/**
 * RegisterForm.jsx
 *
 * The "Create Account" panel. Unlike LoginForm, this component owns its
 * own input state with useState — nothing outside this component needs
 * to see each keystroke, only the final submitted values. That's a
 * deliberate contrast with LoginForm's fully-controlled-by-parent
 * approach, useful for demonstrating that state can live at whichever
 * level of the component tree actually needs it.
 *
 * On submit, this component does NOT send anything to a server (no
 * backend exists yet). Instead it calls `onAccountCreated` with the new
 * account's data so LoginApp can copy the username/password back into
 * the login form, exactly as the assignment requires.
 */
export default function RegisterForm({ onAccountCreated, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onAccountCreated({ name, email, username, password });
  }

  return (
    <div className="auth-card">
      <h2 className="h4">Create Account</h2>
      <p className="auth-subtext">This is a prototype — nothing is sent to a server.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="registerName" className="form-label">
            Name
          </label>
          <input
            id="registerName"
            type="text"
            className="form-control fitted-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="registerEmail" className="form-label">
            Email
          </label>
          <input
            id="registerEmail"
            type="email"
            className="form-control fitted-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="registerUsername" className="form-label">
            Username
          </label>
          <input
            id="registerUsername"
            type="text"
            className="form-control fitted-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="registerPassword" className="form-label">
            Password
          </label>
          <input
            id="registerPassword"
            type="password"
            className="form-control fitted-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-fitted btn-dark w-100 mb-3">
          Create Account
        </button>

        <button type="button" className="btn-fitted btn-outline w-100" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
