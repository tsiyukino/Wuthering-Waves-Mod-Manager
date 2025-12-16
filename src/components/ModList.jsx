import ModItem from "./ModItem";

export default function ModList({
  mods,
  selectedCategory,
  selectedModId,
  onToggleMod,
  onSelectMod
}) {
  const visible = mods.filter(
    m => m.category_id === selectedCategory
  );

  return (
    <>
      <div className="file-list">
        {visible.length === 0 ? (
          <div className="empty-message">No mods in this category.</div>
        ) : (
          visible.map(mod => (
            <ModItem
              key={mod.id}
              mod={mod}
              selected={mod.id === selectedModId}
              onToggle={onToggleMod}
              onSelect={onSelectMod}
            />
          ))
        )}
      </div>
    </>
  );
}
