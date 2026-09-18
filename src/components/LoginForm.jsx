/**
 * LoginForm.jsx
 *
 * A controlled form: every input's value comes from state owned by the
 * parent (LoginApp) and every keystroke is reported back up through
 * `onUsernameChange` / `onPasswordChange`. This is what lets LoginApp
 * auto-fill the username and password after a successful registration —
 * it simply updates its own state, and because these inputs are
 * controlled, they immediately reflect the new values.
 */
export default function LoginForm({ username, password, onUsernameChange, onPasswordChange, onSubmit, onShowRegister }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="auth-card">
      <h1 className="h3">Welcome back</h1>
      <p className="auth-subtext">Sign in to your Fitted account.</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="loginUsername" className="form-label">
            Username
          </label>
          <input
            id="loginUsername"
            type="text"
            className="form-control fitted-input"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="loginPassword" className="form-label">
            Password
          </label>
          <input
            id="loginPassword"
            type="password"
            className="form-control fitted-input"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-fitted btn-dark w-100 mb-3">
          Sign In
        </button>

        <button type="button" className="btn-fitted btn-outline w-100" onClick={onShowRegister}>
          Create Account
        </button>
      </form>
    </div>
  );
}
