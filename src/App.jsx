import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import Sidebar from "./components/Sidebar";
import ManagerView from "./components/ManagerView";
import SettingsView from "./components/SettingsView";

import "./styles/app.css";

export default function App() {
  const [db, setDb] = useState(null);
  const [view, setView] = useState("manager");
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedMod, setSelectedMod] = useState(null);

  useEffect(() => {
    invoke("load_db").then(setDb);
  }, []);

  if (!db) return null;

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

  function addMod() {
    const name = prompt("Mod name");
    if (!name) return;

    persist({
      ...db,
      mods: [
        ...db.mods,
        {
          id: Date.now(),
          name,
          category_id: selectedCategory,
          enabled: false,
          notes: ""
        }
      ]
    });
  }

  function updateNotes(text) {
    if (!selectedMod) return;

    persist({
      ...db,
      mods: db.mods.map(m =>
        m.id === selectedMod.id
          ? { ...m, notes: text }
          : m
      )
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
            onToggleMod={toggleMod}
            onSelectMod={setSelectedMod}
            onUpdateNotes={updateNotes}
            onAddMod={addMod}
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
