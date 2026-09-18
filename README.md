# Fitted

An AI-powered fashion and virtual try-on platform — **Project 1** frontend
prototype for a graduate Web Systems course.

Fitted's long-term concept: browse clothing, upload a photo of yourself,
select an item, and preview how it would look on you using an AI virtual
try-on service. **Project 1 builds only the frontend**, with mock data and
simulated interactions in place of the real backend, database, and AI
integrations that would arrive in Project 2.

## Project Description

Fitted is designed like a real early-stage fashion startup would build it:
a small set of marketing/informational pages (Home, About, Contact) built
with traditional HTML/CSS/JS, plus a product-facing single-page application
(the "Virtual Fitting Room") and a Login page, both built with React. The
whole site shares one visual design system — a minimal, editorial, neutral
color palette meant to feel like a premium fashion brand rather than a
generic SaaS dashboard.

Every interaction that would eventually need a backend (product data,
photo storage, the AI try-on itself, authentication) is either mocked with
local data or clearly isolated behind a single function/service so it can
be replaced with a real API call in Project 2 **without restructuring the
app**.

## Technologies

- **HTML5 / CSS3 / vanilla JavaScript** — Home, About, and Contact pages
- **Bootstrap 5** (via CDN) — responsive grid, navbar collapse, form styling
- **React 18** — the App (Virtual Fitting Room) and Login pages
- **React Router** (`HashRouter`) — client-side navigation inside the App SPA
- **Vite** — development server and production build tool, configured as a
  multi-page app (see `vite.config.js`) so the static pages and the two
  React entry points build into one `dist/` folder together
- **Apache + Docker** — serves the production build (see `DockerContainer/`)

No backend, database, authentication service, or external AI API is used —
intentionally, per the Project 1 scope.

## Project Structure

```
fitted/
├── index.html              # Home (static HTML/CSS/JS)
├── about.html               # About (static HTML/CSS/JS)
├── contact.html              # Contact (static HTML/CSS/JS)
├── app.html                  # Mounts the React "Virtual Fitting Room" SPA
├── login.html                 # Mounts the React Login page
├── vite.config.js             # Multi-page build configuration
├── package.json
├── public/                    # Static assets, copied as-is by Vite
│   ├── css/                   # shared.css (design system) + per-page CSS
│   ├── js/                    # main.js (shared) + contact.js
│   └── images/                # Local SVG placeholder images (hero + products)
├── src/                        # React source (used by app.html & login.html)
│   ├── App.jsx                 # Root of the Fitting Room SPA (routing + state)
│   ├── LoginApp.jsx             # Root of the Login page
│   ├── main-app.jsx              # React entry point for app.html
│   ├── main-login.jsx             # React entry point for login.html
│   ├── components/                 # Reusable React components
│   ├── pages/                       # Shop / Fitting Room / My Looks pages
│   ├── data/products.js               # Mock product catalog
│   ├── services/tryOnService.js       # Simulated try-on API abstraction
│   └── styles/                         # React-page-specific CSS
├── DockerContainer/
│   ├── Dockerfile
│   └── README.md
└── README.md                            # (this file)
```

## Pages

| Page | File | Built with |
|---|---|---|
| Home | `index.html` | HTML/CSS/JS + Bootstrap |
| About | `about.html` | HTML/CSS/JS + Bootstrap |
| Contact | `contact.html` | HTML/CSS/JS + Bootstrap |
| App (Virtual Fitting Room) | `app.html` → `src/App.jsx` | React + React Router |
| Login | `login.html` → `src/LoginApp.jsx` | React |

## React Components

All components live in `src/components/`:

- **Navbar** — the main Fitted site navigation, re-implemented in React so
  it can appear on both the App and Login pages.
- **SpaTabs** — the Fitting Room SPA's own internal navigation
  (Shop / Fitting Room / My Looks), kept conceptually separate from Navbar.
- **ProductCard** — a single product's image, name, category, price,
  favorite (heart) button, and Select button.
- **ProductGrid** — lays out a list of products as ProductCards using
  Bootstrap's responsive grid classes; shows an empty-state message when
  the list is empty.
- **CategoryFilter** — the All / Tops / Outerwear / Dresses / Bottoms pills.
- **PhotoUploader** — lets the user choose a photo from their computer and
  previews it with the FileReader API (nothing is uploaded to a server).
- **SelectedProduct** — shows the currently-selected product and the
  "Try It On" button.
- **TryOnPanel** — shows the simulated try-on loading state and result.
- **FavoritesButton** — the reusable heart-icon toggle used inside
  ProductCard.
- **LoginForm** / **RegisterForm** — the Login page's two forms.

## React State Demonstrations

- **Lifted state** — `src/App.jsx` owns `photo`, `selectedProduct`, and
  `favoriteIds` with `useState`, and passes them (plus setter functions) down
  as props to `ShopPage`, `FittingRoomPage`, and `MyLooksPage`. This is why
  selecting a product in the Shop page is still selected when you switch to
  the Fitting Room tab.
- **Async state / loading states** — `FittingRoomPage.jsx` tracks
  `tryOnStatus` (`"idle" | "loading" | "done"`) around the `await
  simulateTryOn(...)` call, and `TryOnPanel.jsx` renders a different UI for
  each value.
- **Component-local state** — `RegisterForm.jsx` and the category filters in
  `ShopPage.jsx` / `FittingRoomPage.jsx` manage their own `useState` because
  nothing outside those components needs to see every keystroke or filter
  change.
- **Controlled inputs** — `LoginForm.jsx`'s username/password fields are
  fully controlled by `LoginApp.jsx`'s state, which is what makes it
  possible to auto-fill them after "Create Account" is submitted (see
  `LoginApp.handleAccountCreated`).
- **Derived/computed values** — `useMemo` in `FittingRoomPage.jsx` and
  `ShopPage.jsx` recomputes the filtered product list only when the active
  category changes.

## Bootstrap Features

- Responsive navbar with the `navbar-expand-lg` + `navbar-toggler` +
  `collapse` pattern (collapses to a hamburger menu below the `lg`
  breakpoint) — used on every page, including inside the React `Navbar`
  component.
- Bootstrap's grid system (`row`/`col-*`) for the Home page hero, the
  "How Fitted Works" three-column steps, the About page's three-column
  values section, and the Contact page's two-column layout.
- Bootstrap form classes (`form-control`, `form-label`,
  `was-validated`/`invalid-feedback`) on the Contact page for validation
  styling.

## JavaScript Interactions

- **Contact form validation** (`public/js/contact.js`) — uses the
  constraint-validation API (`form.checkValidity()`) and toggles a
  confirmation message with `classList`.
- **Scroll-reveal animation** (`public/js/main.js`) — an
  `IntersectionObserver` fades sections into view as the user scrolls,
  used on Home and About.
- **Active nav-link highlighting** (`public/js/main.js`) — reads
  `window.location.pathname` to mark the current page's nav link.
- **Responsive Bootstrap navbar collapse** — the hamburger menu toggle on
  every page (Bootstrap's own JS bundle).
- **Photo upload + preview, product selection, favoriting, simulated
  try-on, and the Login/Create Account flow** — all implemented as React
  event handlers and state updates (see the React State Demonstrations
  section above).

## Running Locally

```bash
npm install
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). From
there:

- `/` or `/index.html` → Home
- `/about.html` → About
- `/contact.html` → Contact
- `/app.html` → Virtual Fitting Room SPA
- `/login.html` → Login

## Building the React Application

```bash
npm run build
```

This runs Vite's production build for **all five pages** (not just the
React ones) and outputs everything to `dist/`. Preview the production
build locally with:

```bash
npm run preview
```

## Docker Deployment

See [`DockerContainer/README.md`](./DockerContainer/README.md) for full
details. Quick start from the project root:

```bash
docker build -t fitted -f DockerContainer/Dockerfile .
docker run -p 8080:80 fitted
```

Then visit `http://localhost:8080`.

## Future Project 2 Architecture

Project 1 was deliberately structured so Project 2 can add a real backend
without reworking the frontend:

- **`src/services/tryOnService.js`** isolates the "virtual try-on" call
  behind one function, `simulateTryOn()`. Project 2 replaces its body with
  a real `fetch("/api/try-on", { method: "POST", ... })` call to an
  Express endpoint that talks to Google's Virtual Try-On API — no
  component needs to change.
- **`src/data/products.js`** is a static array today; Project 2 can swap it
  for a function that fetches from a database or a commerce API (Shopify,
  Amazon, etc.) and return the same shape of data.
- **The Login page** (`src/LoginApp.jsx`) currently "creates" and "signs
  in" accounts entirely in local component state. Project 2 would replace
  `handleAccountCreated`/`handleLoginSubmit` with real requests to an
  authentication API — the surrounding UI/state structure stays the same.
- **`DockerContainer/`** already serves the static build with Apache;
  Project 2 would add a second container (Node/Express) alongside it,
  likely behind a reverse proxy.

Intentionally **not** built in Project 1: any backend server, database,
real authentication, cloud storage, or calls to Google's Virtual Try-On
API, Shopify, or any other external commerce/AI service.
