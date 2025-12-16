import CategoryTree from "./CategoryTree";
import ModList from "./ModList";
import ModDetails from "./ModDetails";

export default function ManagerView({
  categories,
  mods,
  selectedCategory,
  selectedMod,
  onSelectCategory,
  onToggleCategory,
  onToggleMod,
  onSelectMod,
  onUpdateNotes,
  onAddMod
}) {
  return (
    <div className="content">
      <CategoryTree
        categories={categories}
        selectedId={selectedCategory}
        onSelect={onSelectCategory}
        onToggle={onToggleCategory}
      />

      <div style={{ paddingLeft: 16, flex: 1 }}>
        <div className="header">Mods</div>

        <button onClick={onAddMod}>Add Mod</button>

        <ModList
          mods={mods}
          selectedCategory={selectedCategory}
          onToggleMod={onToggleMod}
          onSelectMod={onSelectMod}
        />
      </div>

      <ModDetails
        mod={selectedMod}
        onUpdateNotes={onUpdateNotes}
      />
    </div>
  );
}
