import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { relaunch } from '@tauri-apps/plugin-process';

import Sidebar from "./components/Sidebar";
import ManagerView from "./components/ManagerView";
import SettingsView from "./components/SettingsView";
import TagsView from "./components/TagsView";
import { PromptDialog, ConfirmDialog, DataMigrationDialog } from "./components/Dialog";

import "./styles/app.css";

export default function App() {
  const [db, setDb] = useState(null);
  const [view, setView] = useState("manager");
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedModId, setSelectedModId] = useState(null);
  const [selectedModIds, setSelectedModIds] = useState([]); // Multi-select
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  
  // Data location states
  const [dataLocation, setDataLocation] = useState("appdata");
  const [appdataPath, setAppdataPath] = useState("");
  const [localPath, setLocalPath] = useState("");
  
  // Dialog states
  const [categoryPrompt, setCategoryPrompt] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [migrationDialog, setMigrationDialog] = useState(null);
  const [restartDialog, setRestartDialog] = useState(false);
  const [moveToDialog, setMoveToDialog] = useState(false);
  
  // Progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // Load paths and data location
    Promise.all([
      invoke("get_appdata_path"),
      invoke("get_local_path"),
      invoke("get_data_location")
    ]).then(([appdata, local, location]) => {
      setAppdataPath(appdata);
      setLocalPath(local);
      setDataLocation(location);
    });

    invoke("load_db").then(async (loadedDb) => {
      // Load previews for all mods
      const modsWithPreviews = await Promise.all(
        loadedDb.mods.map(async (mod) => {
          try {
            const preview = await invoke("load_preview", {
              root: loadedDb.root_folder,
              name: mod.name
            });
            return { ...mod, preview };
          } catch (e) {
            return mod;
          }
        })
      );
      setDb({ ...loadedDb, mods: modsWithPreviews });
    });

    // Listen for progress events
    const unlistenExtract = listen('extract-progress', (event) => {
      setProgressPercent(event.payload);
      setProgressMessage(`Extracting... ${event.payload}%`);
    });

    const unlistenExtractComplete = listen('extract-complete', () => {
      setIsProcessing(false);
      setProgressMessage("");
    });

    const unlistenCopy = listen('copy-progress', (event) => {
      setProgressMessage(event.payload);
    });

    const unlistenCopyComplete = listen('copy-complete', () => {
      setIsProcessing(false);
      setProgressMessage("");
    });

    return () => {
      unlistenExtract.then(fn => fn());
      unlistenExtractComplete.then(fn => fn());
      unlistenCopy.then(fn => fn());
      unlistenCopyComplete.then(fn => fn());
    };
  }, []);

  if (!db) return null;

  // Get the current mod object from the array
  const selectedMod = selectedModId 
    ? db.mods.find(m => m.id === selectedModId) 
    : null;

  function persist(updated) {
    setDb(updated);
    invoke("save_db", { db: updated });
  }

  function toggleCategory(id) {
    persist({
      ...db,
      categories: db.categories.map(c =>
        c.id === id ? { ...c, expanded: !c.expanded } : c
      )
    });
  }

  function addCategory() {
    setCategoryPrompt(true);
  }

  function handleCategoryConfirm(name) {
    setCategoryPrompt(false);
    const newId = Math.max(...db.categories.map(c => c.id), 0) + 1;
    persist({
      ...db,
      categories: [
        ...db.categories,
        {
          id: newId,
          name,
          parent_id: selectedCategory,
          expanded: false
        }
      ]
    });
  }

  function deleteCategory() {
    if (selectedCategory === 1) {
      alert("Cannot delete root category");
      return;
    }

    setDeleteConfirm({
      title: "Delete Category",
      message: "Delete this category? Files will be moved to parent.",
      onConfirm: () => {
        const category = db.categories.find(c => c.id === selectedCategory);
        
        persist({
          ...db,
          categories: db.categories.filter(c => c.id !== selectedCategory),
          mods: db.mods.map(m =>
            m.category_id === selectedCategory
              ? { ...m, category_id: category.parent_id }
              : m
          )
        });

        setSelectedCategory(category.parent_id);
        setDeleteConfirm(null);
      }
    });
  }

  function toggleMod(mod) {
    invoke("toggle_mod", {
      root: db.root_folder,
      name: mod.name,
      enable: !mod.enabled,
      strategy: db.mod_strategy,
      disabledFolder: db.disabled_folder || "_Disabled"
    });

    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === mod.id ? { ...m, enabled: !m.enabled } : m
      )
    });
  }

  async function addMod() {
    if (isProcessing) return;
    
    try {
      // Open file/folder picker for both folders and archives
      const selected = await open({
        multiple: false,
        title: "Select Mod Folder or ZIP Archive",
        filters: [{
          name: 'Mod Files',
          extensions: ['zip']
        }]
      });

      if (!selected) return;

      // Check if it's a ZIP file
      const isZip = selected.toLowerCase().endsWith('.zip');
      
      // Extract folder name from path
      const pathParts = selected.split(/[\\/]/);
      let folderName = pathParts[pathParts.length - 1];
      
      // Remove .zip extension if present
      if (isZip) {
        folderName = folderName.replace(/\.zip$/i, '');
      }

      // Check if mod already exists
      if (db.mods.some(m => m.name === folderName)) {
        alert("A mod with this name already exists!");
        return;
      }

      // Show processing indicator
      setIsProcessing(true);
      setProgressMessage(isZip ? "Extracting archive..." : "Copying folder...");
      setProgressPercent(0);

      // Handle ZIP extraction or folder copy
      try {
        if (isZip) {
          await invoke("extract_archive", {
            archivePath: selected,
            destRoot: db.root_folder,
            destName: folderName
          });
        } else {
          await invoke("copy_mod", {
            source: selected,
            destRoot: db.root_folder,
            destName: folderName
          });
        }
      } catch (copyErr) {
        setIsProcessing(false);
        alert("Failed to " + (isZip ? "extract" : "copy") + " mod: " + copyErr);
        return;
      }

      setIsProcessing(false);
      setProgressMessage("");

      // Add to database
      persist({
        ...db,
        mods: [
          ...db.mods,
          {
            id: Date.now(),
            name: folderName,
            category_id: selectedCategory,
            enabled: true,
            notes: "",
            preview: null,
            tags: []
          }
        ]
      });
    } catch (err) {
      setIsProcessing(false);
      console.error("Failed to add mod:", err);
      alert("Failed to add mod: " + err);
    }
  }

  function deleteMod() {
    if (!selectedModId) return;
    
    const mod = db.mods.find(m => m.id === selectedModId);
    
    setDeleteConfirm({
      title: "Delete Mod",
      message: `Delete mod "${mod.name}" permanently?`,
      onConfirm: () => {
        invoke("delete_mod", {
          root: db.root_folder,
          name: mod.name
        }).catch(err => alert("Error deleting mod: " + err));

        persist({
          ...db,
          mods: db.mods.filter(m => m.id !== selectedModId)
        });

        setSelectedModId(null);
        setDeleteConfirm(null);
      }
    });
  }

  function updateNotes(text) {
    if (!selectedModId) return;

    const mod = db.mods.find(m => m.id === selectedModId);
    
    invoke("save_notes", {
      root: db.root_folder,
      name: mod.name,
      notes: text
    }).catch(err => console.error("Failed to save notes:", err));

    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === selectedModId
          ? { ...m, notes: text }
          : m
      )
    });
  }

  function uploadPreview(dataUrl) {
    if (!selectedModId) return;

    const mod = db.mods.find(m => m.id === selectedModId);

    invoke("save_preview", {
      root: db.root_folder,
      name: mod.name,
      data: dataUrl
    }).catch(err => alert("Error saving preview: " + err));

    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === selectedModId
          ? { ...m, preview: dataUrl }
          : m
      )
    });
  }

  function moveModToCategory(modId, newCategoryId) {
    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === modId
          ? { ...m, category_id: newCategoryId }
          : m
      )
    });
  }

  function selectMod(mod) {
    setSelectedModId(mod ? mod.id : null);
  }

  function handleMultiSelect(modId) {
    if (selectedModIds.includes(modId)) {
      setSelectedModIds(selectedModIds.filter(id => id !== modId));
    } else {
      setSelectedModIds([...selectedModIds, modId]);
    }
  }

  function handleSelectAll() {
    // This will be called from ModList with visible mod IDs
    // We need to pass a callback to ModList instead
  }

  function handleSelectAllVisible(visibleModIds) {
    setSelectedModIds(visibleModIds);
  }

  function handleDeselectAll() {
    setSelectedModIds([]);
  }

  async function handleBulkEnable() {
    if (selectedModIds.length === 0) return;
    
    const modNames = db.mods
      .filter(m => selectedModIds.includes(m.id))
      .map(m => m.name);
    
    try {
      const errors = await invoke("toggle_mods_bulk", {
        root: db.root_folder,
        modNames: modNames,
        enable: true,
        strategy: db.mod_strategy,
        disabledFolder: db.disabled_folder || "_Disabled"
      });
      
      if (errors.length > 0) {
        alert("Some mods failed to enable:\n" + errors.join("\n"));
      }
      
      persist({
        ...db,
        mods: db.mods.map(m =>
          selectedModIds.includes(m.id) ? { ...m, enabled: true } : m
        )
      });
      
      setSelectedModIds([]);
    } catch (err) {
      alert("Bulk enable failed: " + err);
    }
  }

  async function handleBulkDisable() {
    if (selectedModIds.length === 0) return;
    
    const modNames = db.mods
      .filter(m => selectedModIds.includes(m.id))
      .map(m => m.name);
    
    try {
      const errors = await invoke("toggle_mods_bulk", {
        root: db.root_folder,
        modNames: modNames,
        enable: false,
        strategy: db.mod_strategy,
        disabledFolder: db.disabled_folder || "_Disabled"
      });
      
      if (errors.length > 0) {
        alert("Some mods failed to disable:\n" + errors.join("\n"));
      }
      
      persist({
        ...db,
        mods: db.mods.map(m =>
          selectedModIds.includes(m.id) ? { ...m, enabled: false } : m
        )
      });
      
      setSelectedModIds([]);
    } catch (err) {
      alert("Bulk disable failed: " + err);
    }
  }

  function handleBulkDelete() {
    if (selectedModIds.length === 0) return;
    
    setDeleteConfirm({
      title: "Delete Multiple Mods",
      message: `Delete ${selectedModIds.length} mods permanently?`,
      onConfirm: async () => {
        const modNames = db.mods
          .filter(m => selectedModIds.includes(m.id))
          .map(m => m.name);
        
        try {
          const errors = await invoke("delete_mods_bulk", {
            root: db.root_folder,
            modNames: modNames
          });
          
          if (errors.length > 0) {
            alert("Some mods failed to delete:\n" + errors.join("\n"));
          }
          
          persist({
            ...db,
            mods: db.mods.filter(m => !selectedModIds.includes(m.id))
          });
          
          setSelectedModIds([]);
          setDeleteConfirm(null);
        } catch (err) {
          alert("Bulk delete failed: " + err);
        }
      }
    });
  }

  function handleManageTags() {
    setMoveToDialog(true);
  }

  function handleMoveTo(targetCategoryId) {
    if (selectedModIds.length > 0) {
      // Bulk move
      persist({
        ...db,
        mods: db.mods.map(m =>
          selectedModIds.includes(m.id) ? { ...m, category_id: targetCategoryId } : m
        )
      });
      setSelectedModIds([]);
    } else if (selectedModId) {
      // Single move
      persist({
        ...db,
        mods: db.mods.map(m =>
          m.id === selectedModId ? { ...m, category_id: targetCategoryId } : m
        )
      });
    }
    
    setMoveToDialog(false);
  }

  function updateName(newName) {
    if (!selectedModId) return;
    
    const mod = db.mods.find(m => m.id === selectedModId);
    if (!mod || mod.name === newName) return;
    
    // Check if name already exists
    if (db.mods.some(m => m.name === newName && m.id !== selectedModId)) {
      alert("A mod with this name already exists!");
      return;
    }
    
    invoke("rename_mod", {
      root: db.root_folder,
      oldName: mod.name,
      newName: newName
    }).then(() => {
      persist({
        ...db,
        mods: db.mods.map(m =>
          m.id === selectedModId ? { ...m, name: newName } : m
        )
      });
    }).catch(err => {
      alert("Failed to rename mod: " + err);
    });
  }

  function updateTags(newTags) {
    if (!selectedModId) return;
    
    const updatedMods = db.mods.map(m =>
      m.id === selectedModId ? { ...m, tags: newTags } : m
    );
    
    // Update global tags list
    const allTags = new Set(db.tags || []);
    newTags.forEach(tag => allTags.add(tag));
    
    persist({
      ...db,
      mods: updatedMods,
      tags: Array.from(allTags)
    });
  }

  function updateTagMetadata(tagName, newMetadata) {
    const existingIndex = db.tag_metadata?.findIndex(tm => tm.name === tagName) ?? -1;
    let updatedMetadata = [...(db.tag_metadata || [])];
    
    if (existingIndex >= 0) {
      updatedMetadata[existingIndex] = newMetadata;
    } else {
      updatedMetadata.push(newMetadata);
    }
    
    persist({
      ...db,
      tag_metadata: updatedMetadata
    });
  }

  function handleEnableAllInTag(tagName) {
    const modsWithTag = db.mods.filter(m => m.tags && m.tags.includes(tagName));
    const modNames = modsWithTag.map(m => m.name);
    
    if (modNames.length === 0) return;
    
    invoke("toggle_mods_bulk", {
      root: db.root_folder,
      modNames: modNames,
      enable: true,
      strategy: db.mod_strategy,
      disabledFolder: db.disabled_folder || "_Disabled"
    }).then(errors => {
      if (errors.length > 0) {
        alert("Some mods failed to enable:\n" + errors.join("\n"));
      }
      
      persist({
        ...db,
        mods: db.mods.map(m =>
          modsWithTag.find(mt => mt.id === m.id) ? { ...m, enabled: true } : m
        )
      });
    }).catch(err => {
      alert("Failed to enable mods: " + err);
    });
  }

  function handleDisableAllInTag(tagName) {
    const modsWithTag = db.mods.filter(m => m.tags && m.tags.includes(tagName));
    const modNames = modsWithTag.map(m => m.name);
    
    if (modNames.length === 0) return;
    
    invoke("toggle_mods_bulk", {
      root: db.root_folder,
      modNames: modNames,
      enable: false,
      strategy: db.mod_strategy,
      disabledFolder: db.disabled_folder || "_Disabled"
    }).then(errors => {
      if (errors.length > 0) {
        alert("Some mods failed to disable:\n" + errors.join("\n"));
      }
      
      persist({
        ...db,
        mods: db.mods.map(m =>
          modsWithTag.find(mt => mt.id === m.id) ? { ...m, enabled: false } : m
        )
      });
    }).catch(err => {
      alert("Failed to disable mods: " + err);
    });
  }

  function handleSearchInMods(tagName) {
    setView("manager");
    setSearchQuery(tagName);
  }

  function changeModStrategy(strategy) {
    persist({
      ...db,
      mod_strategy: strategy
    });
  }

  async function changeDataLocation(newLocation) {
    try {
      const currentLocation = dataLocation;
      
      if (currentLocation === newLocation) return;
      
      // Check if both locations have data
      const currentExists = await invoke("check_db_exists", { location: currentLocation });
      const newExists = await invoke("check_db_exists", { location: newLocation });
      
      if (currentExists && newExists) {
        // Both have data - load summaries and show migration dialog
        const fromSummary = await invoke("get_db_summary", { location: currentLocation });
        const toSummary = await invoke("get_db_summary", { location: newLocation });
        
        setMigrationDialog({
          from: currentLocation,
          to: newLocation,
          fromSummary: JSON.parse(fromSummary),
          toSummary: JSON.parse(toSummary)
        });
      } else if (currentExists) {
        // Only current has data - migrate it
        await invoke("migrate_data", {
          from: currentLocation,
          to: newLocation,
          deleteOld: true,
          createBackup: false
        });
        
        await invoke("set_data_location", { location: newLocation });
        setRestartDialog(true);
      } else {
        // No data or only new location has data - just switch
        await invoke("set_data_location", { location: newLocation });
        setRestartDialog(true);
      }
    } catch (err) {
      alert("Failed to change data location: " + err);
    }
  }

  async function handleMigrationKeep(keepLocation, createBackup) {
    try {
      const { from, to } = migrationDialog;
      
      if (keepLocation === from) {
        // Keep old location data, overwrite new location
        await invoke("migrate_data", {
          from: from,
          to: to,
          deleteOld: true,
          createBackup: createBackup
        });
      } else {
        // Keep new location data, delete old (new becomes source in migration)
        await invoke("migrate_data", {
          from: to,
          to: to,
          deleteOld: false,
          createBackup: false
        });
        
        // Now delete old location with optional backup
        if (createBackup) {
          // Create backup before deleting
          const oldPath = from === "appdata" 
            ? await invoke("get_appdata_path") 
            : await invoke("get_local_path");
          // Backup will be created by migrate_data when deleteOld is true
          await invoke("migrate_data", {
            from: from,
            to: from + "-temp",
            deleteOld: false,
            createBackup: true
          });
        }
        
        // Delete old location file
        await invoke("migrate_data", {
          from: from,
          to: from,
          deleteOld: true,
          createBackup: false
        });
      }
      
      await invoke("set_data_location", { location: to });
      setMigrationDialog(null);
      setRestartDialog(true);
    } catch (err) {
      alert("Migration failed: " + err);
      setMigrationDialog(null);
    }
  }

  async function handleRestart() {
    try {
      await relaunch();
    } catch (err) {
      alert("Please restart the application manually.");
      setRestartDialog(false);
    }
  }

  return (
    <div className="app">
      <Sidebar view={view} onChangeView={setView} />

      <main className="main">
        {view === "manager" && (
          <ManagerView
            categories={db.categories}
            mods={db.mods}
            selectedCategory={selectedCategory}
            selectedMod={selectedMod}
            selectedModIds={selectedModIds}
            searchQuery={searchQuery}
            onSelectCategory={setSelectedCategory}
            onToggleCategory={toggleCategory}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onToggleMod={toggleMod}
            onSelectMod={selectMod}
            onMultiSelect={handleMultiSelect}
            onSelectAllVisible={handleSelectAllVisible}
            onDeselectAll={handleDeselectAll}
            onAddMod={addMod}
            onDeleteMod={deleteMod}
            onBulkEnable={handleBulkEnable}
            onBulkDisable={handleBulkDisable}
            onBulkDelete={handleBulkDelete}
            onManageTags={handleManageTags}
            onUpdateNotes={updateNotes}
            onUploadPreview={uploadPreview}
            onUpdateTags={updateTags}
            onUpdateName={updateName}
            onMoveModToCategory={moveModToCategory}
            onSearchChange={setSearchQuery}
          />
        )}

        {view === "tags" && (
          <TagsView
            tags={db.tags || []}
            tagMetadata={db.tag_metadata || []}
            mods={db.mods}
            selectedTag={selectedTag}
            searchQuery={tagSearchQuery}
            onSelectTag={setSelectedTag}
            onUpdateTagMetadata={updateTagMetadata}
            onEnableAllInTag={handleEnableAllInTag}
            onDisableAllInTag={handleDisableAllInTag}
            onSearchInMods={handleSearchInMods}
            onSearchChange={setTagSearchQuery}
          />
        )}

        {view === "settings" && (
          <SettingsView
            rootFolder={db.root_folder}
            modStrategy={db.mod_strategy}
            disabledFolder={db.disabled_folder || "_Disabled"}
            dataLocation={dataLocation}
            appdataPath={appdataPath}
            localPath={localPath}
            onChangeRoot={(value) =>
              persist({ ...db, root_folder: value })
            }
            onChangeStrategy={changeModStrategy}
            onChangeDisabledFolder={(value) =>
              persist({ ...db, disabled_folder: value })
            }
            onChangeDataLocation={changeDataLocation}
          />
        )}
      </main>

      <PromptDialog
        isOpen={categoryPrompt}
        title="New Category"
        placeholder="Enter category name"
        onConfirm={handleCategoryConfirm}
        onCancel={() => setCategoryPrompt(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.title}
        message={deleteConfirm?.message}
        onConfirm={deleteConfirm?.onConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />

      <DataMigrationDialog
        isOpen={!!migrationDialog}
        fromLocation={migrationDialog?.from}
        toLocation={migrationDialog?.to}
        fromSummary={migrationDialog?.fromSummary}
        toSummary={migrationDialog?.toSummary}
        onKeep={handleMigrationKeep}
        onCancel={() => setMigrationDialog(null)}
      />

      <ConfirmDialog
        isOpen={restartDialog}
        title="Restart Required"
        message="Data location has been changed. The application needs to restart to apply changes."
        onConfirm={handleRestart}
        onCancel={() => setRestartDialog(false)}
      />

      {moveToDialog && (
        <div className="modal-overlay" onClick={() => setMoveToDialog(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Move to Category</h3>
              <button className="modal-close" onClick={() => setMoveToDialog(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="category-list">
                {db.categories.map(cat => (
                  <div 
                    key={cat.id}
                    className="category-option"
                    onClick={() => handleMoveTo(cat.id)}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setMoveToDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="progress-overlay">
          <div className="progress-dialog">
            <div className="progress-spinner"></div>
            <div className="progress-text">{progressMessage}</div>
            {progressPercent > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
