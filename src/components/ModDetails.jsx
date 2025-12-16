export default function ModDetails({ mod, onUpdateNotes }) {
  if (!mod) {
    return <div className="details">No mod selected.</div>;
  }

  return (
    <div className="details">
      <h3>{mod.name}</h3>

      <div>
        <strong>Status:</strong>{" "}
        {mod.enabled ? "Enabled" : "Disabled"}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Notes</strong>
        <textarea
          value={mod.notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
