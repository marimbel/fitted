/**
 * architecture.js
 * Hover interaction for the Agent Architecture page's pipeline diagram.
 *
 * Each node in the SVG (.flow-box) carries its own explanation in
 * data-title / data-desc. On mouseenter (or keyboard focus / tap) we read
 * those attributes and position a single floating tooltip next to the
 * hovered node, using its live bounding rect, so the tooltip lines up
 * correctly however the SVG is scaled on a given screen (it's a
 * responsive, viewBox-scaled diagram, not fixed pixel dimensions).
 *
 * WHY THE TOOLTIP IS MOVED TO <body>:
 * The diagram sits inside .flow-scroll, which has `overflow-x: auto` so it
 * can scroll sideways on phones. In CSS, once one overflow axis is not
 * `visible`, the other axis is clipped too, so a tooltip rising above the
 * top row of boxes was being cut off. Moving the tooltip to <body> and
 * using `position: fixed` (viewport coordinates) takes it out of that
 * clipping box entirely. We then clamp it to the viewport ourselves, flip
 * it below the node when there isn't room above, and re-position it while
 * the page scrolls.
 *
 * This is plain DOM event handling (addEventListener, getBoundingClientRect,
 * classList), with no framework needed for a single interactive diagram on
 * an otherwise static page.
 */

document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector(".flow-wrap");
  const tooltip = document.getElementById("flowTooltip");
  if (!wrap || !tooltip) return;

  // Escape the overflow-clipping scroll container (see note above).
  document.body.appendChild(tooltip);

  const titleEl = tooltip.querySelector(".flow-tooltip-title");
  const descEl = tooltip.querySelector(".flow-tooltip-desc");
  const boxes = wrap.querySelectorAll(".flow-box");
  const VIEWPORT_MARGIN = 12; // keep this much space from the screen edges
  const GAP = 12; // space between the node and the tooltip (room for the arrow)
  let activeBox = null;

  boxes.forEach((box) => {
    // Make each node reachable by keyboard (Tab) and announce it as a button.
    box.setAttribute("tabindex", "0");
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", box.getAttribute("data-title"));

    box.addEventListener("mouseenter", () => showTooltip(box));
    box.addEventListener("mouseleave", hideTooltip);
    box.addEventListener("focus", () => showTooltip(box));
    box.addEventListener("blur", hideTooltip);
    // Phones have no hover, so a tap toggles the tooltip instead.
    box.addEventListener("click", () => (activeBox === box ? hideTooltip() : showTooltip(box)));
  });

  // A fixed-position tooltip would drift away from its node while the page
  // (or the diagram, on phones) scrolls, so re-measure and move it on every
  // scroll/resize. requestAnimationFrame limits this to once per frame.
  // The capture phase also catches the horizontal scroll inside .flow-scroll.
  let repositionQueued = false;
  function repositionActive() {
    if (!activeBox || repositionQueued) return;
    repositionQueued = true;
    requestAnimationFrame(() => {
      repositionQueued = false;
      if (activeBox) showTooltip(activeBox);
    });
  }
  window.addEventListener("scroll", repositionActive, { passive: true, capture: true });
  window.addEventListener("resize", repositionActive);

  function showTooltip(box) {
    activeBox = box;
    titleEl.textContent = box.getAttribute("data-title");
    descEl.textContent = box.getAttribute("data-desc");

    // Fill in the text first, then measure, so the height is accurate.
    const boxRect = box.getBoundingClientRect();
    const tipWidth = tooltip.offsetWidth;
    const tipHeight = tooltip.offsetHeight;

    // Horizontal: centre on the node, then clamp inside the viewport.
    const idealCenter = boxRect.left + boxRect.width / 2;
    const half = tipWidth / 2;
    const clampedCenter = Math.min(
      Math.max(idealCenter, half + VIEWPORT_MARGIN),
      window.innerWidth - half - VIEWPORT_MARGIN
    );

    // Vertical: prefer above the node; flip below if it wouldn't fit.
    const fitsAbove = boxRect.top - tipHeight - GAP >= VIEWPORT_MARGIN;
    tooltip.classList.toggle("below", !fitsAbove);
    tooltip.style.top = (fitsAbove ? boxRect.top : boxRect.bottom) + "px";
    tooltip.style.left = clampedCenter + "px";

    // Keep the small arrow pointing at the node even after clamping.
    tooltip.style.setProperty("--arrow-shift", idealCenter - clampedCenter + "px");
    tooltip.classList.add("visible");
  }

  function hideTooltip() {
    activeBox = null;
    tooltip.classList.remove("visible");
  }
});
