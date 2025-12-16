export default function SettingsView({ 
  rootFolder, 
  modStrategy, 
  dataLocation,
  appdataPath,
  localPath,
  onChangeRoot, 
  onChangeStrategy,
  onChangeDataLocation 
}) {
  return (
    <div className="settings-view">
      <h2>Settings</h2>
      
      <div className="setting-group">
        <label>Mod Root Folder Path</label>
        <input
          type="text"
          className="text-input"
          value={rootFolder}
          onChange={e => onChangeRoot(e.target.value)}
          placeholder="C:\Games\Mods"
        />
        <div className="setting-hint">
          The folder where all your mod files are stored.
        </div>
      </div>

      <div className="setting-group">
        <label>Mod Management Strategy</label>
        <select
          className="text-input"
          value={modStrategy}
          onChange={e => onChangeStrategy(e.target.value)}
        >
          <option value="wuthering_waves">Wuthering Waves (Rename .ini files)</option>
          <option value="generic_rename">Generic (Rename folder)</option>
        </select>
        <div className="setting-description">
          <strong>Wuthering Waves:</strong> Adds/removes .bak extension to all .ini files in the mod folder
          <br />
          <strong>Generic:</strong> Adds/removes .disabled extension to the entire mod folder
        </div>
      </div>

      <div className="setting-group">
        <label>Data Storage Location</label>
        <select
          className="text-input"
          value={dataLocation}
          onChange={e => onChangeDataLocation(e.target.value)}
        >
          <option value="appdata">AppData (Recommended)</option>
          <option value="local">Local Folder (Portable)</option>
        </select>
        <div className="setting-description">
          <strong>AppData:</strong> {appdataPath}
          <br />
          <strong>Local:</strong> {localPath}
          <br /><br />
          <span className="setting-warning">⚠️ Changing this will require restarting the application.</span>
        </div>
      </div>
    </div>
  );
}
