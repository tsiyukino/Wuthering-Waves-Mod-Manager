import React from "react";
import Icon from "./IconSimple";
import { open } from '@tauri-apps/plugin-dialog';

const THEME_PRESETS = [
  { 
    id: 'default', 
    name: 'Default', 
    primary: '#667eea', 
    secondary: '#764ba2',
    bg: '#ffffff',
    bgSecondary: '#f8f9fa',
    text: '#333333',
    textSecondary: '#666666',
    isDark: false
  },
  { 
    id: 'dark', 
    name: 'Dark Mode', 
    primary: '#667eea', 
    secondary: '#764ba2',
    bg: '#1a1a1a',
    bgSecondary: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    isDark: true
  }
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
  const [customThemes, setCustomThemes] = React.useState(() => {
    const saved = localStorage.getItem('custom-themes');
    return saved ? JSON.parse(saved) : [];
  });

  function handleRootFolderChange(e) {
    setNewRootFolder(e.target.value);
  }

  function handleRootFolderBlur() {
    if (newRootFolder !== rootFolder) {
      onChangeRootWithMigration(newRootFolder);
    }
  }

  function applyTheme(theme) {
    document.documentElement.style.setProperty('--accent-primary', theme.primary);
    document.documentElement.style.setProperty('--accent-secondary', theme.secondary);
    document.documentElement.style.setProperty('--bg-primary', theme.bg);
    document.documentElement.style.setProperty('--bg-secondary', theme.bgSecondary);
    document.documentElement.style.setProperty('--text-primary', theme.text);
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
    
    // Set dark mode class on body for additional styling
    if (theme.isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function handleThemeChange(e) {
    const themeId = e.target.value;
    setSelectedTheme(themeId);
    localStorage.setItem('theme-preset', themeId);
    
    // Find theme in both preset and custom themes
    const allThemes = [...THEME_PRESETS, ...customThemes];
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      applyTheme(theme);
    }
  }

  async function handleImportTheme() {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: "Import Theme",
        filters: [{
          name: 'JSON Files',
          extensions: ['json']
        }]
      });

      if (!selected) return;

      const content = await fetch(`file://${selected}`).then(r => r.text());
      const imported = JSON.parse(content);

      // Validate theme structure
      if (!imported.id || !imported.name || !imported.primary || !imported.secondary) {
        alert("Invalid theme file! Required fields: id, name, primary, secondary, bg, bgSecondary, text, textSecondary, isDark");
        return;
      }

      // Add default values if not present
      const newTheme = {
        id: imported.id,
        name: imported.name,
        primary: imported.primary,
        secondary: imported.secondary,
        bg: imported.bg || '#ffffff',
        bgSecondary: imported.bgSecondary || '#f8f9fa',
        text: imported.text || '#333333',
        textSecondary: imported.textSecondary || '#666666',
        isDark: imported.isDark || false
      };

      // Check if theme with same ID already exists
      const existingIndex = customThemes.findIndex(t => t.id === newTheme.id);
      let updatedThemes;
      
      if (existingIndex >= 0) {
        // Update existing theme
        updatedThemes = [...customThemes];
        updatedThemes[existingIndex] = newTheme;
      } else {
        // Add new theme
        updatedThemes = [...customThemes, newTheme];
      }

      setCustomThemes(updatedThemes);
      localStorage.setItem('custom-themes', JSON.stringify(updatedThemes));

      // Apply the imported theme
      setSelectedTheme(newTheme.id);
      localStorage.setItem('theme-preset', newTheme.id);
      applyTheme(newTheme);

      alert(`Theme "${newTheme.name}" imported successfully!`);
    } catch (err) {
      alert("Failed to import theme: " + err);
    }
  }

  async function handleExportTheme() {
    const allThemes = [...THEME_PRESETS, ...customThemes];
    const theme = allThemes.find(t => t.id === selectedTheme);
    
    if (!theme) {
      alert("No theme selected!");
      return;
    }

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const filePath = await save({
        defaultPath: `${theme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`,
        filters: [{
          name: 'JSON Files',
          extensions: ['json']
        }]
      });

      if (!filePath) return;

      const themeData = JSON.stringify(theme, null, 2);
      await fetch(`file://${filePath}`, {
        method: 'PUT',
        body: themeData
      });

      alert("Theme exported successfully!");
    } catch (err) {
      alert("Failed to export theme: " + err);
    }
  }

  // Apply theme on mount
  React.useEffect(() => {
    const allThemes = [...THEME_PRESETS, ...customThemes];
    const theme = allThemes.find(t => t.id === selectedTheme);
    if (theme) {
      applyTheme(theme);
    }
  }, [selectedTheme, customThemes]);

  return (
    <div className="settings-view">
      <div className="settings-content">
        <h2>Settings</h2>
        
        {/* General Settings Section */}
        <div className="settings-category">
          <h3 className="settings-category-title">General Settings</h3>
          
          <div className="setting-group">
            <label>Theme Preset</label>
            <div className="theme-selector">
              <select
                className="text-input theme-select"
                value={selectedTheme}
                onChange={handleThemeChange}
              >
                <optgroup label="Built-in Themes">
                  {THEME_PRESETS.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </optgroup>
                {customThemes.length > 0 && (
                  <optgroup label="Custom Themes">
                    {customThemes.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button 
                className="secondary-button theme-btn"
                onClick={handleImportTheme}
                title="Import Theme"
              >
                <Icon name="import" size={18} />
              </button>
              <button 
                className="secondary-button theme-btn"
                onClick={handleExportTheme}
                title="Export Current Theme"
              >
                <Icon name="export" size={18} />
              </button>
            </div>
            <div className="setting-hint">
              Choose a color theme for the application interface. Import custom themes or export your current theme.
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
