/**
 * Navbar.jsx
 *
 * The main Fitted site navigation, re-implemented as a React component so
 * it can be rendered at the top of both React pages (App and Login).
 *
 * This is intentionally plain HTML anchor tags (<a href="...">), not
 * React Router <Link> elements — Home/About/Contact/App/Login are
 * separate .html documents (see vite.config.js), so navigating between
 * them is a normal full page load, not a client-side route change.
 *
 * The mobile hamburger toggle is handled by Bootstrap's JS bundle (loaded
 * once via a <script> tag in app.html / login.html) reading the
 * data-bs-toggle/data-bs-target attributes below — no React state needed.
 *
 * `activePage` is a prop (data passed down from a parent component) that
 * tells this component which link to visually highlight.
 */
export default function Navbar({ activePage }) {
  const links = [
    { label: "Home", href: "/index.html", key: "home" },
    { label: "About", href: "/about.html", key: "about" },
    { label: "Contact", href: "/contact.html", key: "contact" },
    { label: "App", href: "/app.html", key: "app" },
    { label: "Login", href: "/login.html", key: "login" },
  ];

  return (
    <nav className="navbar navbar-expand-lg fitted-navbar sticky-top">
      <div className="container-fitted">
        <a className="navbar-brand" href="/index.html">
          Fitted
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#fittedNavReact"
          aria-controls="fittedNavReact"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="fittedNavReact">
          <ul className="navbar-nav align-items-lg-center">
            {links.map((link) => (
              <li className="nav-item" key={link.key}>
                <a className={`nav-link${activePage === link.key ? " active" : ""}`} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
