/**
 * contact.js
 * Client-side validation and a simulated submission for the Contact page.
 * This is a plain HTML/JS form (no React) — it demonstrates basic DOM
 * event handling, the constraint-validation API, and toggling elements
 * with classList, which satisfies the "JavaScript interaction" requirement
 * for this page.
 *
 * No network request is made: this form intentionally does not send data
 * anywhere yet (see project spec — Project 2 would POST this to a backend).
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const confirmationMessage = document.getElementById("confirmationMessage");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    // Always prevent the default browser submission — we handle it ourselves.
    event.preventDefault();

    const isValid = form.checkValidity();

    // Bootstrap's validation styling is opt-in via the "was-validated" class.
    form.classList.add("was-validated");

    if (!isValid) {
      // Stop here and let the invalid-feedback text/borders show the user
      // which fields still need attention.
      confirmationMessage.classList.add("d-none");
      return;
    }

    // Simulate a successful submission.
    confirmationMessage.classList.remove("d-none");

    // Reset the form fields but keep the confirmation message visible.
    form.reset();
    form.classList.remove("was-validated");
  });
});
