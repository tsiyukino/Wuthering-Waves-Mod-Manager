#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub expanded: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagMetadata {
    pub name: String,
    pub description: String,
    pub preview: Option<String>,
    pub mutually_exclusive: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Mod {
    pub id: i64,
    pub name: String,
    pub category_id: i64,
    pub enabled: bool,
    pub notes: String,
    pub preview: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Database {
    pub root_folder: String,
    pub disabled_folder: String,
    pub mod_strategy: String,
    pub categories: Vec<Category>,
    pub mods: Vec<Mod>,
    pub tags: Vec<String>,
    pub tag_metadata: Vec<TagMetadata>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub preview: Option<String>,
}

fn get_storage_location() -> String {
    let config_path = Path::new(".").join("storage-config.json");
    
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(location) = config["storage_location"].as_str() {
                    return location.to_string();
                }
            }
        }
    }
    
    String::from("appdata")
}

fn get_data_dir() -> PathBuf {
    let location = get_storage_location();
    
    if location == "appdata" {
        if let Ok(appdata) = std::env::var("APPDATA").or_else(|_| std::env::var("HOME")) {
            let dir = Path::new(&appdata).join("ModManager");
            let _ = fs::create_dir_all(&dir);
            return dir;
        }
    }
    
    PathBuf::from(".")
}

fn get_games_path() -> PathBuf {
    get_data_dir().join("games.json")
}

fn get_game_db_path(game_id: i64) -> PathBuf {
    get_data_dir().join(format!("game-{}.json", game_id))
}

// ============ GAME MANAGEMENT ============

#[tauri::command]
fn load_games() -> Result<Vec<Game>, String> {
    let path = get_games_path();
    
    if !path.exists() {
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| e.to_string())?;
    
    let games: Vec<Game> = serde_json::from_str(&content)
        .map_err(|e| e.to_string())?;
    
    Ok(games)
}

#[tauri::command]
fn add_game(name: String, description: String, preview: Option<String>) -> Result<Game, String> {
    let mut games = load_games()?;
    
    let new_id = games.iter().map(|g| g.id).max().unwrap_or(0) + 1;
    
    let new_game = Game {
        id: new_id,
        name,
        description,
        preview,
    };
    
    games.push(new_game.clone());
    
    let json = serde_json::to_string_pretty(&games)
        .map_err(|e| e.to_string())?;
    fs::write(&get_games_path(), json)
        .map_err(|e| e.to_string())?;
    
    // Create default database for this game
    let default_db = Database {
        root_folder: String::from("C:\\Games\\Mods"),
        disabled_folder: String::from("_Disabled"),
        mod_strategy: String::from("generic_rename"),
        categories: vec![Category {
            id: 1,
            name: String::from("Root"),
            parent_id: None,
            expanded: true,
        }],
        mods: vec![],
        tags: vec![],
        tag_metadata: vec![],
    };
    
    let db_json = serde_json::to_string_pretty(&default_db)
        .map_err(|e| e.to_string())?;
    fs::write(&get_game_db_path(new_id), db_json)
        .map_err(|e| e.to_string())?;
    
    Ok(new_game)
}

#[tauri::command]
fn update_game(game_id: i64, name: String, description: String, preview: Option<String>) -> Result<(), String> {
    let mut games = load_games()?;
    
    if let Some(game) = games.iter_mut().find(|g| g.id == game_id) {
        game.name = name;
        game.description = description;
        game.preview = preview;
    } else {
        return Err(format!("Game with id {} not found", game_id));
    }
    
    let json = serde_json::to_string_pretty(&games)
        .map_err(|e| e.to_string())?;
    fs::write(&get_games_path(), json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_game(game_id: i64) -> Result<(), String> {
    let mut games = load_games()?;
    games.retain(|g| g.id != game_id);
    
    let json = serde_json::to_string_pretty(&games)
        .map_err(|e| e.to_string())?;
    fs::write(&get_games_path(), json)
        .map_err(|e| e.to_string())?;
    
    // Delete game database file
    let db_path = get_game_db_path(game_id);
    if db_path.exists() {
        fs::remove_file(&db_path)
            .map_err(|e| format!("Failed to delete game data: {}", e))?;
    }
    
    Ok(())
}

// ============ GAME DATABASE MANAGEMENT ============

#[tauri::command]
fn load_game_db(game_id: i64) -> Result<Database, String> {
    let path = get_game_db_path(game_id);
    
    if !path.exists() {
        return Err(format!("Game database not found for game id {}", game_id));
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| e.to_string())?;
    
    let mut db: Database = serde_json::from_str(&content)
        .map_err(|e| e.to_string())?;
    
    // Add fields if they don't exist (for backward compatibility)
    if db.mod_strategy.is_empty() {
        db.mod_strategy = String::from("generic_rename");
    }
    if db.disabled_folder.is_empty() {
        db.disabled_folder = String::from("_Disabled");
    }
    
    Ok(db)
}

#[tauri::command]
fn save_game_db(game_id: i64, db: Database) -> Result<(), String> {
    let path = get_game_db_path(game_id);
    let json = serde_json::to_string_pretty(&db)
        .map_err(|e| e.to_string())?;
    
    fs::write(&path, json)
        .map_err(|e| e.to_string())
}

// ============ LEGACY FUNCTIONS (for backward compatibility) ============

fn get_db_path() -> PathBuf {
    get_data_dir().join("mod-manager.json")
}

#[tauri::command]
fn load_db() -> Result<Database, String> {
    let path = get_db_path();
    
    if !path.exists() {
        let default = Database {
            root_folder: String::from("C:\\Games\\Mods"),
            disabled_folder: String::from("_Disabled"),
            mod_strategy: String::from("generic_rename"),
            categories: vec![Category {
                id: 1,
                name: String::from("Root"),
                parent_id: None,
                expanded: true,
            }],
            mods: vec![],
            tags: vec![],
            tag_metadata: vec![],
        };
        
        let json = serde_json::to_string_pretty(&default)
            .map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        
        return Ok(default);
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| e.to_string())?;
    
    let mut db: Database = serde_json::from_str(&content)
        .map_err(|e| e.to_string())?;
    
    if db.mod_strategy.is_empty() {
        db.mod_strategy = String::from("wuthering_waves");
    }
    if db.disabled_folder.is_empty() {
        db.disabled_folder = String::from("_Disabled");
    }
    
    Ok(db)
}

#[tauri::command]
fn save_db(db: Database) -> Result<(), String> {
    let path = get_db_path();
    let json = serde_json::to_string_pretty(&db)
        .map_err(|e| e.to_string())?;
    
    fs::write(&path, json)
        .map_err(|e| e.to_string())
}

// ============ MOD OPERATIONS ============

#[tauri::command]
fn toggle_mod(root: String, name: String, enable: bool, strategy: String, disabled_folder: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() && !enable {
        return Err(format!("Mod folder does not exist: {}", mod_path.display()));
    }
    
    match strategy.as_str() {
        "wuthering_waves" => toggle_wuthering_waves(&mod_path, enable),
        "generic_rename" => toggle_generic_rename(&mod_path, enable, &root, &disabled_folder),
        _ => Err(format!("Unknown mod strategy: {}", strategy)),
    }
}

fn toggle_wuthering_waves(mod_path: &Path, enable: bool) -> Result<(), String> {
    toggle_files_recursive(mod_path, enable, "ini")
}

fn toggle_generic_rename(mod_path: &Path, enable: bool, root: &str, disabled_folder: &str) -> Result<(), String> {
    let root_path = Path::new(root);
    let disabled_path = root_path.join(disabled_folder);
    
    if !disabled_path.exists() {
        fs::create_dir_all(&disabled_path)
            .map_err(|e| format!("Failed to create disabled folder: {}", e))?;
    }
    
    let folder_name = mod_path.file_name()
        .ok_or_else(|| "Cannot get folder name".to_string())?;
    
    if enable {
        let source = disabled_path.join(folder_name);
        if source.exists() {
            fs::rename(&source, mod_path)
                .map_err(|e| format!("Failed to enable mod: {}", e))?;
        }
    } else {
        let destination = disabled_path.join(folder_name);
        if mod_path.exists() {
            fs::rename(mod_path, &destination)
                .map_err(|e| format!("Failed to disable mod: {}", e))?;
        }
    }
    
    Ok(())
}

fn toggle_files_recursive(dir: &Path, enable: bool, extension: &str) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_dir() {
            toggle_files_recursive(&path, enable, extension)?;
        } else if let Some(ext) = path.extension() {
            let ext_str = ext.to_string_lossy();
            
            if enable {
                if ext_str == "bak" {
                    if let Some(stem) = path.file_stem() {
                        let stem_str = stem.to_string_lossy();
                        if stem_str.ends_with(&format!(".{}", extension)) {
                            let new_path = path.with_extension("");
                            fs::rename(&path, &new_path).map_err(|e| e.to_string())?;
                        }
                    }
                }
            } else {
                if ext_str == extension {
                    let new_path = PathBuf::from(format!("{}.bak", path.display()));
                    fs::rename(&path, &new_path).map_err(|e| e.to_string())?;
                }
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
fn delete_mod(root: String, name: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        return Err(format!("Mod folder does not exist: {}", mod_path.display()));
    }
    
    fs::remove_dir_all(&mod_path)
        .map_err(|e| format!("Failed to delete mod: {}", e))
}

#[tauri::command]
fn rename_mod(root: String, old_name: String, new_name: String) -> Result<(), String> {
    let old_path = Path::new(&root).join(&old_name);
    let new_path = Path::new(&root).join(&new_name);
    
    if !old_path.exists() {
        return Err(format!("Mod folder does not exist: {}", old_path.display()));
    }
    
    if new_path.exists() {
        return Err(format!("A mod with name '{}' already exists", new_name));
    }
    
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename mod folder: {}", e))
}

#[tauri::command]
async fn copy_mod(source: String, dest_root: String, dest_name: String, window: tauri::Window) -> Result<(), String> {
    let source_path = Path::new(&source);
    let dest_path = Path::new(&dest_root).join(&dest_name);
    
    if !source_path.exists() {
        return Err(format!("Source folder does not exist: {}", source_path.display()));
    }
    
    if dest_path.exists() {
        return Err(format!("Destination already exists: {}", dest_path.display()));
    }
    
    fs::create_dir_all(&dest_path)
        .map_err(|e| format!("Failed to create destination: {}", e))?;
    
    let _ = window.emit("copy-progress", "Copying files...");
    copy_dir_recursive(source_path, &dest_path)
        .map_err(|e| format!("Failed to copy mod: {}", e))?;
    
    let _ = window.emit("copy-complete", "Copy complete!");
    
    Ok(())
}

#[tauri::command]
async fn move_mod(source: String, dest_root: String, dest_name: String) -> Result<(), String> {
    let source_path = Path::new(&source);
    let dest_path = Path::new(&dest_root).join(&dest_name);
    
    if !source_path.exists() {
        return Err(format!("Source folder does not exist: {}", source_path.display()));
    }
    
    if dest_path.exists() {
        return Err(format!("Destination already exists: {}", dest_path.display()));
    }
    
    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }
    
    fs::rename(source_path, &dest_path)
        .map_err(|e| format!("Failed to move mod: {}", e))?;
    
    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir(dst)?;
    }
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if ty.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    
    Ok(())
}

// ============ UTILITY FUNCTIONS ============

#[tauri::command]
fn get_appdata_path() -> Result<String, String> {
    let appdata = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|e| format!("Cannot get app data path: {}", e))?;
    
    let path = Path::new(&appdata).join("ModManager");
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_local_path() -> Result<String, String> {
    let current = std::env::current_dir()
        .map_err(|e| format!("Cannot get current directory: {}", e))?;
    Ok(current.to_string_lossy().to_string())
}

#[tauri::command]
fn check_db_exists(location: String) -> Result<bool, String> {
    let path = if location == "appdata" {
        let appdata = get_appdata_path()?;
        Path::new(&appdata).join("mod-manager.json")
    } else {
        Path::new(".").join("mod-manager.json")
    };
    
    Ok(path.exists())
}

#[tauri::command]
fn migrate_data(from: String, to: String, delete_old: bool, create_backup: bool) -> Result<(), String> {
    let from_path = if from == "appdata" {
        let appdata = get_appdata_path()?;
        Path::new(&appdata).join("mod-manager.json")
    } else {
        Path::new(".").join("mod-manager.json")
    };
    
    let to_path = if to == "appdata" {
        let appdata = get_appdata_path()?;
        let dir = Path::new(&appdata);
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        dir.join("mod-manager.json")
    } else {
        Path::new(".").join("mod-manager.json")
    };
    
    if to_path.exists() && !delete_old {
        let backup_path = to_path.with_extension("json.backup");
        fs::copy(&to_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    if from_path.exists() {
        let content = fs::read_to_string(&from_path)
            .map_err(|e| format!("Failed to read source data: {}", e))?;
        
        fs::write(&to_path, content)
            .map_err(|e| format!("Failed to write data: {}", e))?;
        
        if create_backup && !delete_old {
            let backup_path = from_path.with_extension("json.backup");
            let content = fs::read_to_string(&from_path)
                .map_err(|e| format!("Failed to read for backup: {}", e))?;
            fs::write(&backup_path, content)
                .map_err(|e| format!("Failed to create backup: {}", e))?;
        }
        
        if delete_old {
            fs::remove_file(&from_path)
                .map_err(|e| format!("Failed to delete old data: {}", e))?;
        }
    }
    
    Ok(())
}

#[tauri::command]
fn get_db_summary(location: String) -> Result<String, String> {
    let path = if location == "appdata" {
        let appdata = get_appdata_path()?;
        Path::new(&appdata).join("mod-manager.json")
    } else {
        Path::new(".").join("mod-manager.json")
    };
    
    if !path.exists() {
        return Ok(String::from("No data"));
    }
    
    let content = fs::read_to_string(&path)
        .map_err(|e| e.to_string())?;
    
    let db: Database = serde_json::from_str(&content)
        .map_err(|e| e.to_string())?;
    
    let summary = serde_json::json!({
        "categories": db.categories.len(),
        "mods": db.mods.len(),
        "root_folder": db.root_folder,
        "mod_strategy": db.mod_strategy
    });
    
    serde_json::to_string_pretty(&summary)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_mods_bulk(
    root: String, 
    mod_names: Vec<String>, 
    enable: bool, 
    strategy: String, 
    disabled_folder: String
) -> Result<Vec<String>, String> {
    let mut errors = Vec::new();
    
    for name in mod_names {
        if let Err(e) = toggle_mod(
            root.clone(), 
            name.clone(), 
            enable, 
            strategy.clone(), 
            disabled_folder.clone()
        ) {
            errors.push(format!("{}: {}", name, e));
        }
    }
    
    Ok(errors)
}

#[tauri::command]
fn delete_mods_bulk(root: String, mod_names: Vec<String>) -> Result<Vec<String>, String> {
    let mut errors = Vec::new();
    
    for name in mod_names {
        if let Err(e) = delete_mod(root.clone(), name.clone()) {
            errors.push(format!("{}: {}", name, e));
        }
    }
    
    Ok(errors)
}

#[tauri::command]
fn set_data_location(location: String) -> Result<(), String> {
    let config_path = Path::new(".").join("storage-config.json");
    
    let config = serde_json::json!({
        "storage_location": location
    });
    
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| e.to_string())?;
    
    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to save storage config: {}", e))
}

#[tauri::command]
fn get_data_location() -> Result<String, String> {
    Ok(get_storage_location())
}

#[tauri::command]
async fn extract_archive(archive_path: String, dest_root: String, dest_name: String, window: tauri::Window) -> Result<(), String> {
    let archive_file = fs::File::open(&archive_path)
        .map_err(|e| format!("Failed to open archive: {}", e))?;
    
    let mut archive = ZipArchive::new(archive_file)
        .map_err(|e| format!("Failed to read archive: {}", e))?;
    
    let dest_path = Path::new(&dest_root).join(&dest_name);
    
    if dest_path.exists() {
        return Err(format!("Destination already exists: {}", dest_path.display()));
    }
    
    fs::create_dir_all(&dest_path)
        .map_err(|e| format!("Failed to create destination: {}", e))?;
    
    let total_files = archive.len();
    
    for i in 0..total_files {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read archive entry: {}", e))?;
        
        let outpath = match file.enclosed_name() {
            Some(path) => dest_path.join(path),
            None => continue,
        };
        
        let progress = ((i + 1) as f32 / total_files as f32 * 100.0) as u32;
        let _ = window.emit("extract-progress", progress);
        
        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }
            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Failed to create file: {}", e))?;
            io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Failed to extract file: {}", e))?;
        }
    }
    
    let _ = window.emit("extract-complete", "Extraction complete!");
    
    Ok(())
}

#[tauri::command]
fn save_preview(root: String, name: String, data: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;
    }
    
    let data = data.split(',').nth(1).unwrap_or(&data);
    
    let bytes = base64_decode(data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    
    let preview_path = mod_path.join("preview.png");
    fs::write(&preview_path, bytes)
        .map_err(|e| format!("Failed to save preview: {}", e))
}

#[tauri::command]
fn load_preview(root: String, name: String) -> Result<Option<String>, String> {
    let mod_path = Path::new(&root).join(&name);
    
    for ext in &["png", "jpg", "jpeg", "bmp", "gif"] {
        let preview_path = mod_path.join(format!("preview.{}", ext));
        if preview_path.exists() {
            let bytes = fs::read(&preview_path)
                .map_err(|e| e.to_string())?;
            let encoded = base64_encode(&bytes);
            return Ok(Some(format!("data:image/{};base64,{}", ext, encoded)));
        }
    }
    
    Ok(None)
}

#[tauri::command]
fn save_notes(root: String, name: String, notes: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;
    }
    
    let notes_path = mod_path.join("notes.txt");
    fs::write(&notes_path, notes)
        .map_err(|e| format!("Failed to save notes: {}", e))
}

#[tauri::command]
fn load_notes(root: String, name: String) -> Result<String, String> {
    let mod_path = Path::new(&root).join(&name);
    let notes_path = mod_path.join("notes.txt");
    
    if notes_path.exists() {
        fs::read_to_string(&notes_path)
            .map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

#[tauri::command]
fn export_config(path: String, data: String) -> Result<(), String> {
    fs::write(&path, data)
        .map_err(|e| format!("Failed to export configuration: {}", e))
}

#[tauri::command]
fn import_config(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to import configuration: {}", e))
}

// Base64 encoding/decoding
fn base64_encode(data: &[u8]) -> String {
    use std::fmt::Write;
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    let mut result = String::new();
    let mut i = 0;
    
    while i < data.len() {
        let b1 = data[i];
        let b2 = if i + 1 < data.len() { data[i + 1] } else { 0 };
        let b3 = if i + 2 < data.len() { data[i + 2] } else { 0 };
        
        let _ = write!(&mut result, "{}",
            CHARS[(b1 >> 2) as usize] as char);
        let _ = write!(&mut result, "{}",
            CHARS[(((b1 & 0x03) << 4) | (b2 >> 4)) as usize] as char);
        
        if i + 1 < data.len() {
            let _ = write!(&mut result, "{}",
                CHARS[(((b2 & 0x0f) << 2) | (b3 >> 6)) as usize] as char);
        } else {
            result.push('=');
        }
        
        if i + 2 < data.len() {
            let _ = write!(&mut result, "{}",
                CHARS[(b3 & 0x3f) as usize] as char);
        } else {
            result.push('=');
        }
        
        i += 3;
    }
    
    result
}

fn base64_decode(data: &str) -> Result<Vec<u8>, String> {
    let data = data.trim_end_matches('=');
    let mut result = Vec::new();
    let mut buffer = 0u32;
    let mut bits = 0;
    
    for ch in data.chars() {
        let value = match ch {
            'A'..='Z' => ch as u32 - 'A' as u32,
            'a'..='z' => ch as u32 - 'a' as u32 + 26,
            '0'..='9' => ch as u32 - '0' as u32 + 52,
            '+' => 62,
            '/' => 63,
            _ => return Err(format!("Invalid base64 character: {}", ch)),
        };
        
        buffer = (buffer << 6) | value;
        bits += 6;
        
        if bits >= 8 {
            bits -= 8;
            result.push((buffer >> bits) as u8);
            buffer &= (1 << bits) - 1;
        }
    }
    
    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            // Game management
            load_games,
            add_game,
            update_game,
            delete_game,
            load_game_db,
            save_game_db,
            // Legacy database (for backward compatibility)
            load_db,
            save_db,
            // Mod operations
            toggle_mod,
            delete_mod,
            rename_mod,
            copy_mod,
            move_mod,
            extract_archive,
            save_preview,
            load_preview,
            save_notes,
            load_notes,
            export_config,
            import_config,
            // Utility
            get_appdata_path,
            get_local_path,
            check_db_exists,
            migrate_data,
            set_data_location,
            get_data_location,
            get_db_summary,
            toggle_mods_bulk,
            delete_mods_bulk,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
