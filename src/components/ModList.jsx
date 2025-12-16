import ModItem from "./ModItem";

export default function ModList({
  mods,
  selectedCategory,
  onToggleMod,
  onSelectMod
}) {
  const visible = mods.filter(
    m => m.category_id === selectedCategory
  );

  if (visible.length === 0) {
    return <div>No mods in this category.</div>;
  }

  return (
    <>
      {visible.map(mod => (
        <ModItem
          key={mod.id}
          mod={mod}
          onToggle={onToggleMod}
          onSelect={onSelectMod}
        />
      ))}
    </>
  );
}
