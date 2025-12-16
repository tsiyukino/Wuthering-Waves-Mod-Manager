import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';

import Sidebar from "./components/Sidebar";
import ManagerView from "./components/ManagerView";
import SettingsView from "./components/SettingsView";
import { PromptDialog, ConfirmDialog } from "./components/Dialog";

import "./styles/app.css";

export default function App() {
  const [db, setDb] = useState(null);
  const [view, setView] = useState("manager");
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedModId, setSelectedModId] = useState(null);
  
  // Dialog states
  const [categoryPrompt, setCategoryPrompt] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
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
      strategy: db.mod_strategy
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
            preview: null
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

  function changeModStrategy(strategy) {
    persist({
      ...db,
      mod_strategy: strategy
    });
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
            onSelectCategory={setSelectedCategory}
            onToggleCategory={toggleCategory}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onToggleMod={toggleMod}
            onSelectMod={selectMod}
            onAddMod={addMod}
            onDeleteMod={deleteMod}
            onUpdateNotes={updateNotes}
            onUploadPreview={uploadPreview}
            onMoveModToCategory={moveModToCategory}
          />
        )}

        {view === "settings" && (
          <SettingsView
            rootFolder={db.root_folder}
            modStrategy={db.mod_strategy}
            onChangeRoot={(value) =>
              persist({ ...db, root_folder: value })
            }
            onChangeStrategy={changeModStrategy}
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
