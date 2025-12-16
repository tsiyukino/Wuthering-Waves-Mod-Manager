import { useState, useRef, useEffect } from "react";
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
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(400);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizingLeft) {
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= 200 && newWidth <= 500) {
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
            <span>➕</span> Add
          </button>
          <button className="secondary-button" onClick={onDeleteCategory}>
            <span>🗑️</span> Delete
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

      <div
        className="resize-handle"
        onMouseDown={() => setIsResizingRight(true)}
      />

      <div className="right-panel" style={{ width: rightWidth }}>
        <ModDetails
          mod={selectedMod}
          onUpdateNotes={onUpdateNotes}
          onUploadPreview={onUploadPreview}
        />
      </div>
    </div>
  );
}
