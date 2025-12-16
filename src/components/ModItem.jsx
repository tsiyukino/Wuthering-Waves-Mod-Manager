export default function ModItem({ mod, onToggle, onSelect }) {
  return (
    <div
      className={
        "mod-item" + (mod.enabled ? "" : " disabled")
      }
      onClick={() => onSelect(mod)}
    >
      <span>{mod.name}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(mod);
        }}
      >
        {mod.enabled ? "Disable" : "Enable"}
      </button>
    </div>
  );
}
