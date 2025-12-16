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
  onAddCategory,
  onDeleteCategory,
  onToggleMod,
  onSelectMod,
  onAddMod,
  onDeleteMod,
  onUpdateNotes,
  onUploadPreview,
  onMoveModToCategory
}) {
  return (
    <div className="manager-layout">
      <div className="left-panel">
        <div className="panel-header">Categories</div>
        
        <CategoryTree
          categories={categories}
          selectedId={selectedCategory}
          onSelect={onSelectCategory}
          onToggle={onToggleCategory}
          onDrop={onMoveModToCategory}
        />

        <div className="panel-actions">
          <button className="secondary-button" onClick={onAddCategory}>
            <span>➕</span> Add
          </button>
          <button className="secondary-button" onClick={onDeleteCategory}>
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      <div className="middle-panel">
        <div className="panel-header">
          Files <span className="file-count">
            {mods.filter(m => m.category_id === selectedCategory).length} files
          </span>
        </div>

        <ModList
          mods={mods}
          selectedCategory={selectedCategory}
          selectedModId={selectedMod?.id}
          onToggleMod={onToggleMod}
          onSelectMod={onSelectMod}
        />

        <div className="panel-actions">
          <button className="secondary-button" onClick={onAddMod}>
            <span>➕</span> Add File
          </button>
          <button 
            className="secondary-button" 
            onClick={() => onToggleMod(selectedMod)}
            disabled={!selectedMod}
          >
            {selectedMod?.enabled ? "Disable" : "Enable"}
          </button>
          <button 
            className="secondary-button" 
            onClick={onDeleteMod}
            disabled={!selectedMod}
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      <ModDetails
        mod={selectedMod}
        onUpdateNotes={onUpdateNotes}
        onUploadPreview={onUploadPreview}
      />
    </div>
  );
}
