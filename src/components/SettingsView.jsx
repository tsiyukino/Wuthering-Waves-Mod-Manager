import React from "react";

export default function SettingsView({ 
  rootFolder, 
  modStrategy,
  disabledFolder,
  dataLocation,
  appdataPath,
  localPath,
  onChangeRoot,
  onChangeRootWithMigration,
  onChangeStrategy,
  onChangeDisabledFolder,
  onChangeDataLocation,
  onExportConfig,
  onImportConfig
}) {
  const [newRootFolder, setNewRootFolder] = React.useState(rootFolder);

  function handleRootFolderChange(e) {
    setNewRootFolder(e.target.value);
  }

  function handleRootFolderBlur() {
    if (newRootFolder !== rootFolder) {
      onChangeRootWithMigration(newRootFolder);
    }
  }

  return (
    <div className="settings-view">
      <h2>Settings</h2>
      
      {/* General Settings Section */}
      <div className="settings-category">
        <h3 className="settings-category-title">General Settings</h3>
        
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

        <div className="setting-group">
          <label>Configuration Import/Export</label>
          <div className="setting-buttons">
            <button className="secondary-button" onClick={onExportConfig}>
              <span>💾</span> Export Configuration
            </button>
            <button className="secondary-button" onClick={onImportConfig}>
              <span>📥</span> Import Configuration
            </button>
          </div>
          <div className="setting-hint">
            Export/import your categories, mods, and tags to share or backup.
          </div>
        </div>
      </div>

      {/* Game-Specific Settings Section */}
      <div className="settings-category">
        <h3 className="settings-category-title">Game-Specific Settings</h3>
        
        <div className="setting-group">
          <label>Mod Root Folder Path</label>
          <input
            type="text"
            className="text-input"
            value={newRootFolder}
            onChange={handleRootFolderChange}
            onBlur={handleRootFolderBlur}
            placeholder="C:\Games\Mods"
          />
          <div className="setting-hint">
            The folder where all your mod files are stored. Changes will prompt to migrate mods.
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
            <option value="generic_rename">Generic (Move to disabled folder)</option>
          </select>
          <div className="setting-description">
            <strong>Wuthering Waves:</strong> Adds/removes .bak extension to all .ini files in the mod folder
            <br />
            <strong>Generic:</strong> Moves mod folder to/from the disabled folder
          </div>
        </div>

        {modStrategy === "generic_rename" && (
          <div className="setting-group">
            <label>Disabled Mods Folder Name</label>
            <input
              type="text"
              className="text-input"
              value={disabledFolder}
              onChange={e => onChangeDisabledFolder(e.target.value)}
              placeholder="_Disabled"
            />
            <div className="setting-hint">
              Folder name (inside root folder) where disabled mods are moved to.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
