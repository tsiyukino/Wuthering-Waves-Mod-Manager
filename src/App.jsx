import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';

import Sidebar from "./components/Sidebar";
import ManagerView from "./components/ManagerView";
import SettingsView from "./components/SettingsView";

import "./styles/app.css";

export default function App() {
  const [db, setDb] = useState(null);
  const [view, setView] = useState("manager");
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedModId, setSelectedModId] = useState(null);

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
    const name = prompt("Enter category name:");
    if (!name) return;

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

    if (!confirm("Delete this category? Files will be moved to parent.")) {
      return;
    }

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
  }

  function toggleMod(mod) {
    invoke("toggle_mod", {
      root: db.root_folder,
      name: mod.name,
      enable: !mod.enabled
    });

    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === mod.id ? { ...m, enabled: !m.enabled } : m
      )
    });
  }

  async function addMod() {
    try {
      // Open folder picker
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Mod Folder"
      });

      if (!selected) return;

      // Extract folder name from path
      const pathParts = selected.split(/[\\/]/);
      const folderName = pathParts[pathParts.length - 1];

      // Check if mod already exists
      if (db.mods.some(m => m.name === folderName)) {
        alert("A mod with this name already exists!");
        return;
      }

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
      console.error("Failed to add mod:", err);
      alert("Failed to add mod: " + err);
    }
  }

  function deleteMod() {
    if (!selectedModId) return;
    
    const mod = db.mods.find(m => m.id === selectedModId);
    if (!confirm(`Delete mod "${mod.name}" permanently?`)) {
      return;
    }

    invoke("delete_mod", {
      root: db.root_folder,
      name: mod.name
    }).catch(err => alert("Error deleting mod: " + err));

    persist({
      ...db,
      mods: db.mods.filter(m => m.id !== selectedModId)
    });

    setSelectedModId(null);
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
            onChangeRoot={(value) =>
              persist({ ...db, root_folder: value })
            }
          />
        )}
      </main>
    </div>
  );
}
