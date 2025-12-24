// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct CodeDependency {
    file_path: String,
    imports: Vec<String>,
    store_usage: Vec<String>,
    component_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnalysisResult {
    dependencies: Vec<CodeDependency>,
    total_files: usize,
}

#[tauri::command]
fn analyze_codebase(base_path: String) -> Result<AnalysisResult, String> {
    println!("🔍 [RUST] Analyse démarrée pour: {}", base_path);
    
    let src_path = PathBuf::from(&base_path).join("src/components");
    
    println!("📂 [RUST] Chemin cible: {:?}", src_path);
    
    if !src_path.exists() {
        let error = format!("src/components directory not found at {:?}", src_path);
        println!("❌ [RUST] {}", error);
        return Err(error);
    }

    let mut dependencies = Vec::new();
    let mut total_files = 0;

    // Parcourir récursivement les fichiers .tsx et .ts
    if let Ok(entries) = visit_dirs(&src_path) {
        println!("📚 [RUST] {} fichiers trouvés au total", entries.len());
        
        for entry in entries {
            if let Some(ext) = entry.extension() {
                if ext == "tsx" || ext == "ts" {
                    total_files += 1;
                    
                    println!("📄 [RUST] Lecture: {:?}", entry.file_name());
                    
                    if let Ok(content) = fs::read_to_string(&entry) {
                        let file_name = entry.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("unknown")
                            .to_string();
                        
                        let imports = extract_imports(&content);
                        let store_usage = extract_store_usage(&content);
                        let component_name = extract_component_name(&content, &file_name);
                        
                        println!("   └─ Component: {}", component_name);
                        println!("   └─ Imports: {}", imports.len());
                        println!("   └─ Store usage: {:?}", store_usage);
                        
                        dependencies.push(CodeDependency {
                            file_path: entry.to_string_lossy().to_string(),
                            imports,
                            store_usage,
                            component_name,
                        });
                    }
                }
            }
        }
    }

    println!("✅ [RUST] Analyse terminée: {} fichiers TypeScript, {} dépendances", total_files, dependencies.len());

    Ok(AnalysisResult {
        dependencies,
        total_files,
    })
}

fn visit_dirs(dir: &PathBuf) -> Result<Vec<PathBuf>, std::io::Error> {
    let mut files = Vec::new();
    
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                files.extend(visit_dirs(&path)?);
            } else {
                files.push(path);
            }
        }
    }
    
    Ok(files)
}

fn extract_imports(content: &str) -> Vec<String> {
    let mut imports = Vec::new();
    
    for line in content.lines() {
        if line.trim().starts_with("import") && line.contains("from") {
            if let Some(from_pos) = line.find("from") {
                let import_path = &line[from_pos + 4..];
                let import_path = import_path
                    .trim()
                    .trim_matches(|c| c == '\'' || c == '"' || c == ';')
                    .to_string();
                
                if !import_path.is_empty() {
                    imports.push(import_path);
                }
            }
        }
    }
    
    imports
}

fn extract_store_usage(content: &str) -> Vec<String> {
    let mut usage = Vec::new();
    
    // Détecter useStore((state) => state.xxx)
    for line in content.lines() {
        if line.contains("useStore") && line.contains("state.") {
            if let Some(state_pos) = line.find("state.") {
                let after_state = &line[state_pos + 6..];
                
                // Extraire le nom de la propriété
                let property: String = after_state
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_')
                    .collect();
                
                if !property.is_empty() && !usage.contains(&property) {
                    usage.push(property);
                }
            }
        }
    }
    
    usage
}

fn extract_component_name(content: &str, file_name: &str) -> String {
    // Essayer de détecter "export function ComponentName"
    for line in content.lines() {
        if line.contains("export function") || line.contains("export const") {
            if let Some(name_start) = line.find("function ").or_else(|| line.find("const ")) {
                let after_keyword = &line[name_start + 9..]; // "function " = 9 chars
                let name: String = after_keyword
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_')
                    .collect();
                
                if !name.is_empty() {
                    return name;
                }
            }
        }
    }
    
    // Fallback: nom du fichier sans extension
    file_name.trim_end_matches(".tsx").trim_end_matches(".ts").to_string()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![analyze_codebase])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
