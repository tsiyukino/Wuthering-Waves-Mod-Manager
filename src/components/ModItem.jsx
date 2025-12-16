export default function ModItem({ mod, selected, onToggle, onSelect }) {
  function handleDragStart(e) {
    e.dataTransfer.setData("modId", mod.id.toString());
  }

  return (
    <div
      className={
        "file-item" + 
        (selected ? " selected" : "")
      }
      onClick={() => onSelect(mod)}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="file-info">
        <div className="file-name">{mod.name}</div>
        <div className="file-path">{mod.name}</div>
      </div>

      <div className={`status-badge ${mod.enabled ? "enabled" : "disabled"}`}>
        {mod.enabled ? "Enabled" : "Disabled"}
      </div>
    </div>
  );
}
