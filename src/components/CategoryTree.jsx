import Icon from "./IconSimple";

function CategoryNode({
  category,
  categories,
  selectedId,
  onSelect,
  onToggle,
  onDrop
}) {
  const children = categories.filter(c => c.parent_id === category.id);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const modId = parseInt(e.dataTransfer.getData("modId"));
    if (modId && onDrop) {
      onDrop(modId, category.id);
    }
  }

  return (
    <div>
      <div
        className={
          "category" +
          (selectedId === category.id ? " selected" : "")
        }
        onClick={() => onSelect(category.id)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {children.length > 0 && (
          <span
            className="expand-icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(category.id);
            }}
          >
            {category.expanded ? "▼ " : "▶ "}
          </span>
        )}
        <span className="folder-icon">
          <Icon name="folder" size={16} />
        </span>
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
              onDrop={onDrop}
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
