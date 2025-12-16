#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
struct Category {
    id: u64,
    name: String,
    parent_id: Option<u64>,
    expanded: bool
}

#[derive(Serialize, Deserialize, Clone)]
struct ModEntry {
    id: u64,
    name: String,
    category_id: u64,
    enabled: bool,
    notes: String
}

#[derive(Serialize, Deserialize)]
struct Database {
    root_folder: String,
    categories: Vec<Category>,
    mods: Vec<ModEntry>
}

fn db_path() -> PathBuf {
    let exe = std::env::current_exe().unwrap();
    exe.parent().unwrap().join("mod-manager.json")
}

fn ensure_dirs(root: &str) {
    let _ = fs::create_dir_all(format!("{root}/mods_enabled"));
    let _ = fs::create_dir_all(format!("{root}/mods_disabled"));
}

#[tauri::command]
fn load_db() -> Database {
    if db_path().exists() {
        serde_json::from_str(&fs::read_to_string(db_path()).unwrap()).unwrap()
    } else {
        Database {
            root_folder: "C:/Games/Mods".into(),
            categories: vec![
                Category { id: 1, name: "Root".into(), parent_id: None, expanded: true }
            ],
            mods: vec![]
        }
    }
}

#[tauri::command]
fn save_db(db: Database) {
    ensure_dirs(&db.root_folder);
    fs::write(db_path(), serde_json::to_string_pretty(&db).unwrap()).unwrap();
}

#[tauri::command]
fn toggle_mod(root: String, name: String, enable: bool) {
    let src = if enable { "mods_disabled" } else { "mods_enabled" };
    let dst = if enable { "mods_enabled" } else { "mods_disabled" };

    let from = format!("{root}/{src}/{name}");
    let to = format!("{root}/{dst}/{name}");

    let _ = fs::create_dir_all(format!("{root}/{dst}"));
    let _ = fs::rename(from, to);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_db,
            save_db,
            toggle_mod
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
