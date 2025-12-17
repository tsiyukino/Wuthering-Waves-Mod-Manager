import React from "react";

export default function SettingsView({ 
  rootFolder, 
  modStrategy,
  disabledFolder,
  dataLocation,
  appdataPath,
  localPath,
  hasGameSelected,
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
      <div className="settings-content">
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
        </div>

        {/* Game-Specific Settings Section */}
        <div className={`settings-category ${!hasGameSelected ? 'settings-disabled' : ''}`}>
          <h3 className="settings-category-title">
            Game-Specific Settings
            {!hasGameSelected && <span className="settings-disabled-hint"> (Select a game first)</span>}
          </h3>
          
          <div className="setting-group">
            <label>Mod Root Folder Path</label>
            <input
              type="text"
              className="text-input"
              value={newRootFolder}
              onChange={handleRootFolderChange}
              onBlur={handleRootFolderBlur}
              placeholder="C:\Games\Mods"
              disabled={!hasGameSelected}
            />
            <div className="setting-hint">
              The folder where all your mod files are stored. Changes will prompt to migrate mods.
            </div>
          </div>

          <div className="setting-group">
            <label>Mod Management Strategy</label>
            <div className="strategy-selector">
              <select
                className="text-input strategy-select"
                value={modStrategy}
                onChange={e => onChangeStrategy(e.target.value)}
                disabled={!hasGameSelected}
              >
                <option value="generic_rename">Generic (Move to folder)</option>
                <option value="wuthering_waves">Wuthering Waves (.ini rename)</option>
              </select>
              <button 
                className="secondary-button strategy-add-btn"
                disabled={!hasGameSelected}
                onClick={() => alert("Custom strategy feature coming soon!")}
              >
                <span>+</span>
              </button>
            </div>
            <div className="setting-description">
              <strong>Generic:</strong> Moves mod folder to/from a disabled folder when toggling
              <br />
              <strong>Wuthering Waves:</strong> Adds/removes .bak extension to .ini files when toggling
              <br />
              <br />
              <strong>Custom Strategies:</strong> You can create your own mod management strategies for specific games. Click the + button to add a custom strategy.
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
                disabled={!hasGameSelected}
              />
              <div className="setting-hint">
                Folder name (inside root folder) where disabled mods are moved to.
              </div>
            </div>
          )}

          <div className="setting-group">
            <label>Configuration Import/Export</label>
            <div className="setting-buttons">
              <button 
                className="secondary-button" 
                onClick={onExportConfig}
                disabled={!hasGameSelected}
              >
                <span>💾</span> Export Configuration
              </button>
              <button 
                className="secondary-button" 
                onClick={onImportConfig}
                disabled={!hasGameSelected}
              >
                <span>📥</span> Import Configuration
              </button>
            </div>
            <div className="setting-hint">
              Export/import your categories, mods, and tags to share or backup.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
