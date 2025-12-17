import React from "react";
import Icon from "./IconSimple";

const THEME_PRESETS = [
  { id: 'default', name: 'Default', primary: '#667eea', secondary: '#764ba2' },
  { id: 'ocean', name: 'Ocean Blue', primary: '#2E86DE', secondary: '#54A0FF' },
  { id: 'forest', name: 'Forest Green', primary: '#26A65B', secondary: '#2ECC71' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#EE5A6F', secondary: '#F39C12' },
  { id: 'purple', name: 'Royal Purple', primary: '#9B59B6', secondary: '#8E44AD' },
  { id: 'crimson', name: 'Crimson Red', primary: '#E74C3C', secondary: '#C0392B' },
];

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
  const [selectedTheme, setSelectedTheme] = React.useState(() => {
    return localStorage.getItem('theme-preset') || 'default';
  });

  function handleRootFolderChange(e) {
    setNewRootFolder(e.target.value);
  }

  function handleRootFolderBlur() {
    if (newRootFolder !== rootFolder) {
      onChangeRootWithMigration(newRootFolder);
    }
  }

  function handleThemeChange(e) {
    const themeId = e.target.value;
    setSelectedTheme(themeId);
    localStorage.setItem('theme-preset', themeId);
    
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (theme) {
      document.documentElement.style.setProperty('--accent-primary', theme.primary);
      document.documentElement.style.setProperty('--accent-secondary', theme.secondary);
    }
  }

  // Apply theme on mount
  React.useEffect(() => {
    const theme = THEME_PRESETS.find(t => t.id === selectedTheme);
    if (theme) {
      document.documentElement.style.setProperty('--accent-primary', theme.primary);
      document.documentElement.style.setProperty('--accent-secondary', theme.secondary);
    }
  }, [selectedTheme]);

  return (
    <div className="settings-view">
      <div className="settings-content">
        <h2>Settings</h2>
        
        {/* General Settings Section */}
        <div className="settings-category">
          <h3 className="settings-category-title">General Settings</h3>
          
          <div className="setting-group">
            <label>Theme Preset</label>
            <select
              className="text-input"
              value={selectedTheme}
              onChange={handleThemeChange}
            >
              {THEME_PRESETS.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
            <div className="setting-hint">
              Choose a color theme for the application interface
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
                <Icon name="add" size={24} />
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
                <Icon name="export" size={18} /> Export Configuration
              </button>
              <button 
                className="secondary-button" 
                onClick={onImportConfig}
                disabled={!hasGameSelected}
              >
                <Icon name="import" size={18} /> Import Configuration
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
