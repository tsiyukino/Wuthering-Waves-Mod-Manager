export default function SettingsView({ rootFolder, onChangeRoot }) {
  return (
    <>
      <div className="header">Settings</div>

      <input
        style={{ width: "100%" }}
        value={rootFolder}
        onChange={e => onChangeRoot(e.target.value)}
      />
    </>
  );
}
