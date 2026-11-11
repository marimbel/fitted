/**
 * architecture.js
 * Hover interaction for the Agent Architecture page's pipeline diagram.
 *
 * Each node in the SVG (.flow-box) carries its own explanation in
 * data-title / data-desc. On mouseenter we read those attributes and
 * position a single floating tooltip above the hovered node, using its
 * live bounding rect — so the tooltip lines up correctly no matter how
 * the SVG happens to be scaled on a given screen (it's a responsive,
 * viewBox-scaled diagram, not fixed pixel dimensions).
 *
 * This is plain DOM event handling (addEventListener, getBoundingClientRect,
 * classList) — no framework needed for a single interactive diagram on an
 * otherwise static page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector(".flow-wrap");
  const tooltip = document.getElementById("flowTooltip");
  if (!wrap || !tooltip) return;

  const titleEl = tooltip.querySelector(".flow-tooltip-title");
  const descEl = tooltip.querySelector(".flow-tooltip-desc");
  const boxes = wrap.querySelectorAll(".flow-box");

  boxes.forEach((box) => {
    box.addEventListener("mouseenter", () => showTooltip(box));
    box.addEventListener("mouseleave", hideTooltip);
  });

  function showTooltip(box) {
    titleEl.textContent = box.getAttribute("data-title");
    descEl.textContent = box.getAttribute("data-desc");

    const boxRect = box.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const idealCenter = boxRect.left - wrapRect.left + boxRect.width / 2;
    const halfTooltip = tooltip.offsetWidth / 2 || 116;
    const margin = 8;

    // Keep the tooltip fully inside the diagram's wrapping box, and
    // shift its little pointer arrow to still point at the hovered
    // node even when the tooltip itself has been nudged inward (this
    // matters most for the leftmost/rightmost nodes, "App" and
    // "Firestore", which would otherwise clip off the page edge).
    const clampedCenter = Math.min(
      Math.max(idealCenter, halfTooltip + margin),
      wrapRect.width - halfTooltip - margin
    );

    tooltip.style.left = clampedCenter + "px";
    tooltip.style.top = boxRect.top - wrapRect.top + "px";
    tooltip.style.setProperty("--arrow-shift", idealCenter - clampedCenter + "px");
    tooltip.classList.add("visible");
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }
});
