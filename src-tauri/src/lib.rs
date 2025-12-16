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
pub struct Mod {
    pub id: i64,
    pub name: String,
    pub category_id: i64,
    pub enabled: bool,
    pub notes: String,
    pub preview: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Database {
    pub root_folder: String,
    pub mod_strategy: String,
    pub categories: Vec<Category>,
    pub mods: Vec<Mod>,
}

fn get_db_path() -> PathBuf {
    let mut path = PathBuf::from(".");
    path.push("mod-manager.json");
    path
}

#[tauri::command]
fn load_db() -> Result<Database, String> {
    let path = get_db_path();
    
    if !path.exists() {
        let default = Database {
            root_folder: String::from("C:\\Games\\Mods"),
            mod_strategy: String::from("wuthering_waves"),
            categories: vec![Category {
                id: 1,
                name: String::from("Root"),
                parent_id: None,
                expanded: true,
            }],
            mods: vec![],
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
    
    // Add mod_strategy if it doesn't exist (for backward compatibility)
    if db.mod_strategy.is_empty() {
        db.mod_strategy = String::from("wuthering_waves");
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

#[tauri::command]
fn toggle_mod(root: String, name: String, enable: bool, strategy: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        return Err(format!("Mod folder does not exist: {}", mod_path.display()));
    }
    
    match strategy.as_str() {
        "wuthering_waves" => toggle_wuthering_waves(&mod_path, enable),
        "generic_rename" => toggle_generic_rename(&mod_path, enable),
        _ => Err(format!("Unknown mod strategy: {}", strategy)),
    }
}

fn toggle_wuthering_waves(mod_path: &Path, enable: bool) -> Result<(), String> {
    toggle_files_recursive(mod_path, enable, "ini")
}

fn toggle_generic_rename(mod_path: &Path, enable: bool) -> Result<(), String> {
    // For generic strategy, rename the entire folder
    let parent = mod_path.parent()
        .ok_or_else(|| "Cannot get parent directory".to_string())?;
    
    let folder_name = mod_path.file_name()
        .ok_or_else(|| "Cannot get folder name".to_string())?
        .to_string_lossy();
    
    if enable {
        // Remove .disabled suffix
        if folder_name.ends_with(".disabled") {
            let new_name = folder_name.trim_end_matches(".disabled");
            let new_path = parent.join(new_name);
            fs::rename(mod_path, &new_path)
                .map_err(|e| format!("Failed to enable mod: {}", e))?;
        }
    } else {
        // Add .disabled suffix
        if !folder_name.ends_with(".disabled") {
            let new_name = format!("{}.disabled", folder_name);
            let new_path = parent.join(new_name);
            fs::rename(mod_path, &new_path)
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
                // Check if file ends with .bak and original extension matches
                if ext_str == "bak" {
                    if let Some(stem) = path.file_stem() {
                        let stem_str = stem.to_string_lossy();
                        if stem_str.ends_with(&format!(".{}", extension)) {
                            // Remove .bak extension
                            let new_path = path.with_extension("");
                            fs::rename(&path, &new_path).map_err(|e| e.to_string())?;
                        }
                    }
                }
            } else {
                // Add .bak extension to matching files
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
async fn copy_mod(source: String, dest_root: String, dest_name: String, window: tauri::Window) -> Result<(), String> {
    let source_path = Path::new(&source);
    let dest_path = Path::new(&dest_root).join(&dest_name);
    
    if !source_path.exists() {
        return Err(format!("Source folder does not exist: {}", source_path.display()));
    }
    
    if dest_path.exists() {
        return Err(format!("Destination already exists: {}", dest_path.display()));
    }
    
    // Create destination directory
    fs::create_dir_all(&dest_path)
        .map_err(|e| format!("Failed to create destination: {}", e))?;
    
    // Copy directory contents recursively with progress
    let _ = window.emit("copy-progress", "Copying files...");
    copy_dir_recursive(source_path, &dest_path)
        .map_err(|e| format!("Failed to copy mod: {}", e))?;
    
    let _ = window.emit("copy-complete", "Copy complete!");
    
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
        
        // Emit progress
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
    
    // Remove the data URL prefix
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

// Simple base64 encoding/decoding
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
        .invoke_handler(tauri::generate_handler![
            load_db,
            save_db,
            toggle_mod,
            delete_mod,
            copy_mod,
            extract_archive,
            save_preview,
            load_preview,
            save_notes,
            load_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
