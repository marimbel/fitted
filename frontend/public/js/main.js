/**
 * main.js
 * Shared vanilla-JS behavior loaded on every traditional HTML page
 * (Home, About, Contact). Two small, easy-to-explain interactions:
 *
 *   1. Active-link highlighting in the navbar based on the current page.
 *   2. A scroll-triggered "reveal" animation using IntersectionObserver.
 *
 * Bootstrap itself handles the responsive hamburger collapse (data-bs-*
 * attributes in the HTML) — no extra JS is needed for that part.
 */

document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNavLink();
  observeRevealElements();
});

/**
 * Adds an "active" class to whichever nav link matches the current
 * page's file name, so the user can see where they are in the site.
 */
function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".fitted-navbar .nav-link");

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
}

/**
 * Fades/slides elements with the ".reveal" class into view as the user
 * scrolls past them. Uses IntersectionObserver instead of a scroll event
 * listener, which is the modern, performant way to do this in the browser.
 */
function observeRevealElements() {
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => observer.observe(el));
}
