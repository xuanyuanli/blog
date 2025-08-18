#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use claude_code_provider_manager_gui::{
    commands::*, services::*, utils::*, errors::Result
};
use std::sync::Arc;
use tracing::{info, error};

fn main() {
    // 初始化日志
    init_logging().expect("Failed to initialize logging");
    
    info!("Starting Claude Code Provider Manager GUI");
    
    // 运行Tauri应用
    tauri::Builder::default()
        .setup(|app| {
            let services = init_services();
            app.manage(services.config_service);
            app.manage(services.environment_service); 
            app.manage(services.system_service);
            info!("Application setup completed");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 配置管理
            load_config,
            save_config,
            export_config,
            import_config,
            update_settings,
            cleanup_old_backups,
            // 提供商管理
            get_providers,
            get_provider_by_id,
            get_active_provider,
            add_provider,
            update_provider,
            delete_provider,
            switch_provider,
            // 环境管理
            switch_environment,
            get_current_environment,
            clear_environment,
            get_all_env_vars,
            // 验证
            validate_provider_connection,
            validate_provider_full,
            validate_url_format,
            validate_auth_token_format,
            validate_model_name,
            // 启动器
            launch_claude_code,
            get_process_status,
            terminate_process,
            list_active_processes,
            cleanup_finished_processes,
            get_system_info,
            open_file_manager,
            open_url,
        ])
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_logging() -> Result<()> {
    // 简化的日志初始化
    tracing_subscriber::fmt()
        .with_env_filter("claude_code_provider_manager_gui=info")
        .init();
    
    Ok(())
}

fn init_services() -> AppState {
    match AppState::new() {
        Ok(state) => {
            info!("Services initialized successfully");
            state
        }
        Err(e) => {
            error!("Failed to initialize services: {}", e);
            std::process::exit(1);
        }
    }
}

#[derive(Debug)]
pub struct AppState {
    pub config_service: Arc<ConfigService>,
    pub environment_service: Arc<EnvironmentService>,
    pub system_service: Arc<SystemService>,
}

impl AppState {
    pub fn new() -> Result<Self> {
        // 创建安全服务
        let security_service = Arc::new(SecurityService::new()?);
        
        // 创建配置服务
        let config_service = Arc::new(ConfigService::new(security_service)?);
        
        // 创建环境服务
        let environment_service = Arc::new(EnvironmentService::new());
        
        // 创建系统服务
        let system_service = Arc::new(SystemService::new());
        
        Ok(Self {
            config_service,
            environment_service,
            system_service,
        })
    }
}

fn create_system_tray() -> tauri::SystemTray {
    let quit = tauri::CustomMenuItem::new("quit".to_string(), "退出");
    let show = tauri::CustomMenuItem::new("show".to_string(), "显示界面");
    let launch = tauri::CustomMenuItem::new("launch".to_string(), "启动 Claude Code");
    
    let tray_menu = tauri::SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(launch)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    tauri::SystemTray::new().with_menu(tray_menu)
}

fn handle_system_tray_event(app: &tauri::AppHandle, event: tauri::SystemTrayEvent) {
    match event {
        tauri::SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        tauri::SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "quit" => {
                    info!("Exiting application via system tray");
                    std::process::exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "launch" => {
                    // 这里可以实现快速启动逻辑
                    info!("Quick launch requested from system tray");
                }
                _ => {}
            }
        }
        _ => {}
    }
}