/**
 * FavoritesButton.jsx
 *
 * A small, reusable heart-icon toggle button. It has no state of its
 * own — it is a "controlled" component that simply displays whatever
 * `isFavorite` boolean it's given and reports clicks upward through the
 * `onToggle` callback prop. This pattern (state lives in a parent,
 * children just render props and call callbacks) is one of the core
 * React ideas this project demonstrates.
 */
export default function FavoritesButton({ isFavorite, onToggle }) {
  return (
    <button
      type="button"
      className={`favorites-btn${isFavorite ? " is-favorite" : ""}`}
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from My Looks" : "Save to My Looks"}
      title={isFavorite ? "Remove from My Looks" : "Save to My Looks"}
    >
      {/* Simple inline heart icon so no extra image asset is needed */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s-7.5-4.6-10-9.1C0.4 8.6 1.8 5 5.4 4.2c2-0.4 4 0.5 5.1 2.2 1.1-1.7 3.1-2.6 5.1-2.2 3.6 0.8 5 4.4 3.4 7.7C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
