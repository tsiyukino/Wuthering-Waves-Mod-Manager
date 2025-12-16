export default function ModItem({ mod, selected, isMultiSelected, onToggle, onSelect, onMultiSelect }) {
  function handleDragStart(e) {
    e.dataTransfer.setData("modId", mod.id.toString());
  }

  function handleClick(e) {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd click for multi-select
      onMultiSelect(mod.id);
    } else {
      // Single click or double click to deselect
      if (selected) {
        onSelect(null);
      } else {
        onSelect(mod);
      }
    }
  }

  function handleCheckboxChange(e) {
    e.stopPropagation();
    onMultiSelect(mod.id);
  }

  return (
    <div
      className={
        "file-item" + 
        (selected ? " selected" : "") +
        (isMultiSelected ? " multi-selected" : "")
      }
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
    >
      <input
        type="checkbox"
        className="mod-checkbox"
        checked={isMultiSelected}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="file-info">
        <div className="file-name">{mod.name}</div>
        <div className="file-path">{mod.name}</div>
        
        {mod.tags && mod.tags.length > 0 && (
          <div className="mod-tags">
            {mod.tags.map(tag => (
              <span key={tag} className="mod-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className={`status-badge ${mod.enabled ? "enabled" : "disabled"}`}>
        {mod.enabled ? "Enabled" : "Disabled"}
      </div>
    </div>
  );
}
