import { useState, useRef, useEffect } from "react";
import CategoryTree from "./CategoryTree";
import ModList from "./ModList";
import ModDetails from "./ModDetails";
import Icon from "./IconSimple";

export default function ManagerView({
  categories,
  mods,
  selectedCategory,
  selectedMod,
  selectedModIds,
  searchQuery,
  onSelectCategory,
  onToggleCategory,
  onAddCategory,
  onDeleteCategory,
  onToggleMod,
  onSelectMod,
  onMultiSelect,
  onSelectAllVisible,
  onDeselectAll,
  onAddMod,
  onDeleteMod,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
  onManageTags,
  onUpdateNotes,
  onUploadPreview,
  onUpdateTags,
  onUpdateName,
  onMoveModToCategory,
  onSearchChange
}) {
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(400);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef(null);

  function getAllSubcategoryIds(categoryId) {
    const ids = [categoryId];
    const children = categories.filter(c => c.parent_id === categoryId);
    
    for (const child of children) {
      ids.push(...getAllSubcategoryIds(child.id));
    }
    
    return ids;
  }

  const categoryIds = getAllSubcategoryIds(selectedCategory);
  let visibleMods = mods.filter(m => categoryIds.includes(m.category_id));
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    visibleMods = visibleMods.filter(m => 
      m.name.toLowerCase().includes(query) ||
      (m.tags && m.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }

  const visibleModIds = visibleMods.map(m => m.id);

  function handleSelectAll() {
    onSelectAllVisible(visibleModIds);
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizingLeft) {
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= 240 && newWidth <= 500) {
          setLeftWidth(newWidth);
        }
      }

      if (isResizingRight) {
        const newWidth = containerRect.right - e.clientX;
        if (newWidth >= 300 && newWidth <= 600) {
          setRightWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight]);

  return (
    <div className="manager-layout" ref={containerRef}>
      <div className="left-panel" style={{ width: leftWidth }}>
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
            <Icon name="add" size={18} /> Add
          </button>
          <button className="secondary-button" onClick={onDeleteCategory}>
            <Icon name="delete" size={18} /> Delete
          </button>
        </div>
      </div>

      <div
        className="resize-handle"
        onMouseDown={() => setIsResizingLeft(true)}
      />

      <div className="middle-panel">
        <div className="panel-header">
          Files <span className="file-count">
            {mods.filter(m => m.category_id === selectedCategory).length} files
          </span>
        </div>

        <ModList
          mods={mods}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedModId={selectedMod?.id}
          selectedModIds={selectedModIds}
          searchQuery={searchQuery}
          onToggleMod={onToggleMod}
          onSelectMod={onSelectMod}
          onMultiSelect={onMultiSelect}
          onSelectAllVisible={onSelectAllVisible}
          onDeselectAll={onDeselectAll}
          onSearchChange={onSearchChange}
        />

        <div className="panel-actions">
          {selectedModIds.length > 0 ? (
            <>
              <div className="bulk-info">
                {selectedModIds.length} selected
              </div>
              <button className="secondary-button" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="secondary-button" onClick={onDeselectAll}>
                Deselect
              </button>
              <button className="secondary-button" onClick={onBulkEnable}>
                <Icon name="enable" size={18} /> Enable Selected
              </button>
              <button className="secondary-button" onClick={onBulkDisable}>
                <Icon name="disable" size={18} /> Disable Selected
              </button>
              <button className="secondary-button" onClick={onManageTags}>
                <Icon name="move" size={18} /> Move To...
              </button>
              <button className="secondary-button" onClick={onBulkDelete}>
                <Icon name="delete" size={18} /> Delete Selected
              </button>
            </>
          ) : (
            <>
              <button className="secondary-button" onClick={onAddMod}>
                <Icon name="add" size={18} /> Add File
              </button>
              <button className="secondary-button" onClick={handleSelectAll}>
                Select All
              </button>
              <button 
                className="secondary-button" 
                onClick={() => onToggleMod(selectedMod)}
                disabled={!selectedMod}
              >
                {selectedMod?.enabled ? <><Icon name="disable" size={18} /> Disable</> : <><Icon name="enable" size={18} /> Enable</>}
              </button>
              <button 
                className="secondary-button" 
                onClick={onManageTags}
                disabled={!selectedMod}
              >
                <Icon name="move" size={18} /> Move To...
              </button>
              <button 
                className="secondary-button" 
                onClick={onDeleteMod}
                disabled={!selectedMod}
              >
                <Icon name="delete" size={18} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="resize-handle"
        onMouseDown={() => setIsResizingRight(true)}
        style={{ display: selectedMod ? 'block' : 'none' }}
      />

      {selectedMod && (
        <div className="right-panel" style={{ width: rightWidth }}>
          <ModDetails
            mod={selectedMod}
            allTags={mods.flatMap(m => m.tags || []).filter((v, i, a) => a.indexOf(v) === i)}
            onUpdateNotes={onUpdateNotes}
            onUploadPreview={onUploadPreview}
            onUpdateTags={onUpdateTags}
            onUpdateName={onUpdateName}
          />
        </div>
      )}
    </div>
  );
}
