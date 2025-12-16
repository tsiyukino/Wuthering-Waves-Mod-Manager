export default function SettingsView({ rootFolder, onChangeRoot }) {
  return (
    <div className="settings-view">
      <h2>Settings</h2>
      
      <div className="setting-group">
        <label>Root Folder Path</label>
        <input
          type="text"
          className="text-input"
          value={rootFolder}
          onChange={e => onChangeRoot(e.target.value)}
          placeholder="C:\Games\Mods"
        />
      </div>
    </div>
  );
}
