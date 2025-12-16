function CategoryNode({
  category,
  categories,
  selectedId,
  onSelect,
  onToggle
}) {
  const children = categories.filter(c => c.parent_id === category.id);

  return (
    <div>
      <div
        className={
          "category" +
          (selectedId === category.id ? " selected" : "")
        }
        onClick={() => onSelect(category.id)}
      >
        {children.length > 0 && (
          <span onClick={(e) => {
            e.stopPropagation();
            onToggle(category.id);
          }}>
            {category.expanded ? "▼ " : "▶ "}
          </span>
        )}
        {category.name}
      </div>

      {category.expanded && children.length > 0 && (
        <div className="category-children">
          {children.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              categories={categories}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree(props) {
  const root = props.categories.find(c => c.parent_id === null);

  if (!root) return null;

  return (
    <div className="categories">
      <CategoryNode {...props} category={root} />
    </div>
  );
}
