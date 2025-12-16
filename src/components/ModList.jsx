import ModItem from "./ModItem";

export default function ModList({
  mods,
  categories,
  selectedCategory,
  selectedModId,
  selectedModIds,
  searchQuery,
  onToggleMod,
  onSelectMod,
  onMultiSelect,
  onSearchChange
}) {
  // Get all subcategory IDs recursively
  function getAllSubcategoryIds(categoryId) {
    const ids = [categoryId];
    const children = categories.filter(c => c.parent_id === categoryId);
    
    for (const child of children) {
      ids.push(...getAllSubcategoryIds(child.id));
    }
    
    return ids;
  }

  const categoryIds = getAllSubcategoryIds(selectedCategory);
  let visible = mods.filter(m => categoryIds.includes(m.category_id));
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    visible = visible.filter(m => 
      m.name.toLowerCase().includes(query) ||
      (m.tags && m.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by name or tag..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="search-clear"
            onClick={() => onSearchChange("")}
          >
            ×
          </button>
        )}
      </div>

      <div className="file-list">
        {visible.length === 0 ? (
          <div className="empty-message">
            {searchQuery ? "No mods match your search." : "No mods in this category."}
          </div>
        ) : (
          visible.map(mod => (
            <ModItem
              key={mod.id}
              mod={mod}
              selected={mod.id === selectedModId}
              isMultiSelected={selectedModIds.includes(mod.id)}
              onToggle={onToggleMod}
              onSelect={onSelectMod}
              onMultiSelect={onMultiSelect}
            />
          ))
        )}
      </div>
    </>
  );
}
