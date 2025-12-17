import ModItem from "./ModItem";
import Icon from "./IconSimple";

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
  onSelectAllVisible,
  onDeselectAll,
  onSearchChange
}) {
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
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    visible = visible.filter(m => 
      m.name.toLowerCase().includes(query) ||
      (m.tags && m.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  function getDirectChildren(parentId) {
    return categories.filter(c => c.parent_id === parentId);
  }

  function getCategoryMods(categoryId) {
    return visible.filter(m => m.category_id === categoryId);
  }

  function renderCategoryGroup(category, depth = 0) {
    const modsInCategory = getCategoryMods(category.id);
    const children = getDirectChildren(category.id);
    const hasContent = modsInCategory.length > 0 || children.length > 0;
    
    if (!hasContent) return null;

    return (
      <div key={category.id} className="category-group" style={{ marginLeft: depth * 20 }}>
        {depth > 0 && (
          <div className="category-group-header">
            📁 {category.name}
          </div>
        )}
        
        {modsInCategory.map(mod => (
          <ModItem
            key={mod.id}
            mod={mod}
            selected={mod.id === selectedModId}
            isMultiSelected={selectedModIds.includes(mod.id)}
            onToggle={onToggleMod}
            onSelect={onSelectMod}
            onMultiSelect={onMultiSelect}
          />
        ))}

        {children.map(child => renderCategoryGroup(child, depth + 1))}
      </div>
    );
  }

  const visibleModIds = visible.map(m => m.id);

  return (
    <>
      <div className="search-bar">
        <Icon name="search" size={20} style={{ marginRight: 8 }} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or tag..."
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
          <>
            {categories
              .filter(c => c.id === selectedCategory)
              .map(rootCat => renderCategoryGroup(rootCat, 0))}
          </>
        )}
      </div>
    </>
  );
}
