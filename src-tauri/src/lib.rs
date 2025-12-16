use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

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
    pub categories: Vec<Category>,
    pub mods: Vec<Mod>,
}

fn get_db_path() -> PathBuf {
    let mut path = PathBuf::from(".");
    path.push("mod-manager.json");
    path
}

#[tauri::command]
pub fn load_db() -> Result<Database, String> {
    let path = get_db_path();
    
    if !path.exists() {
        let default = Database {
            root_folder: String::from("C:\\Games\\Mods"),
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
    
    serde_json::from_str(&content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_db(db: Database) -> Result<(), String> {
    let path = get_db_path();
    let json = serde_json::to_string_pretty(&db)
        .map_err(|e| e.to_string())?;
    
    fs::write(&path, json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_mod(root: String, name: String, enable: bool) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        return Err(format!("Mod folder does not exist: {}", mod_path.display()));
    }
    
    for entry in fs::read_dir(&mod_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if let Some(ext) = path.extension() {
            if enable && ext == "bak" {
                if let Some(stem) = path.file_stem() {
                    let stem_str = stem.to_string_lossy();
                    if stem_str.ends_with(".ini") {
                        let new_path = path.with_extension("");
                        fs::rename(&path, &new_path).map_err(|e| e.to_string())?;
                    }
                }
            } else if !enable && ext == "ini" {
                let new_path = path.with_extension("ini.bak");
                fs::rename(&path, &new_path).map_err(|e| e.to_string())?;
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
pub fn delete_mod(root: String, name: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        return Err(format!("Mod folder does not exist: {}", mod_path.display()));
    }
    
    fs::remove_dir_all(&mod_path)
        .map_err(|e| format!("Failed to delete mod: {}", e))
}

#[tauri::command]
pub fn save_preview(root: String, name: String, data: String) -> Result<(), String> {
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
pub fn load_preview(root: String, name: String) -> Result<Option<String>, String> {
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
pub fn save_notes(root: String, name: String, notes: String) -> Result<(), String> {
    let mod_path = Path::new(&root).join(&name);
    
    if !mod_path.exists() {
        fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;
    }
    
    let notes_path = mod_path.join("notes.txt");
    fs::write(&notes_path, notes)
        .map_err(|e| format!("Failed to save notes: {}", e))
}

#[tauri::command]
pub fn load_notes(root: String, name: String) -> Result<String, String> {
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
        .invoke_handler(tauri::generate_handler![
            load_db,
            save_db,
            toggle_mod,
            delete_mod,
            save_preview,
            load_preview,
            save_notes,
            load_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
