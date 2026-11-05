import { NavLink } from "react-router-dom";

/**
 * SpaTabs.jsx
 *
 * The Virtual Fitting Room's own internal navigation (Shop / Fitting
 * Room / My Looks). This is intentionally a separate, smaller nav bar
 * from the main site Navbar above it — the assignment asks for this
 * SPA navigation to be conceptually distinct from the main site nav,
 * even though visually they sit on the same page.
 *
 * `NavLink` (from react-router-dom) is like a normal <Link> but
 * automatically adds an "active" class when its `to` path matches the
 * current route, which is why we don't have to track "which tab is
 * active" ourselves.
 */
export default function SpaTabs() {
  return (
    <div className="spa-tabs">
      <NavLink to="/shop" className={({ isActive }) => `spa-tab${isActive ? " is-active" : ""}`}>
        Shop
      </NavLink>
      <NavLink to="/" end className={({ isActive }) => `spa-tab${isActive ? " is-active" : ""}`}>
        Fitting Room
      </NavLink>
      <NavLink to="/my-looks" className={({ isActive }) => `spa-tab${isActive ? " is-active" : ""}`}>
        My Looks
      </NavLink>
    </div>
  );
}
