/**
 * CategoryFilter.jsx
 *
 * A row of pill-style buttons for filtering the product grid by category.
 * `activeCategory` and `onChange` follow the same controlled-component
 * pattern as the rest of the app: this component doesn't decide which
 * category is active, it just displays what it's told and reports clicks.
 */
export default function CategoryFilter({ categories, activeCategory, onChange }) {
  return (
    <div className="category-filter" role="tablist" aria-label="Filter products by category">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          role="tab"
          aria-selected={category === activeCategory}
          className={`category-pill${category === activeCategory ? " is-active" : ""}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
