import { invoke } from '@tauri-apps/api/tauri';
import type {
  Configuration,
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  AppSettings,
  ValidationResult,
  ConnectionTest,
  EnvironmentInfo,
  LaunchConfig,
  ProcessInfo,
  ProcessStatus,
} from '@/types';

class ApiService {
  // 配置管理
  async loadConfig(): Promise<Configuration> {
    return invoke('load_config');
  }

  async saveConfig(): Promise<void> {
    return invoke('save_config');
  }

  async exportConfig(includeTokens: boolean = false): Promise<string> {
    return invoke('export_config', { includeTokens });
  }

  async importConfig(configJson: string, merge: boolean = false): Promise<Configuration> {
    return invoke('import_config', { configJson, merge });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    return invoke('update_settings', { settings });
  }

  async cleanupOldBackups(): Promise<string[]> {
    return invoke('cleanup_old_backups');
  }

  // 提供商管理
  async getProviders(): Promise<Provider[]> {
    return invoke('get_providers');
  }

  async getProviderById(id: string): Promise<Provider | null> {
    return invoke('get_provider_by_id', { id });
  }

  async getActiveProvider(): Promise<Provider | null> {
    return invoke('get_active_provider');
  }

  async addProvider(request: CreateProviderRequest): Promise<Provider> {
    return invoke('add_provider', { request });
  }

  async updateProvider(id: string, request: UpdateProviderRequest): Promise<Provider> {
    return invoke('update_provider', { id, request });
  }

  async deleteProvider(id: string): Promise<void> {
    return invoke('delete_provider', { id });
  }

  async switchProvider(id: string): Promise<Provider> {
    return invoke('switch_provider', { id });
  }

  // 环境管理
  async switchEnvironment(providerId: string): Promise<void> {
    return invoke('switch_environment', { providerId });
  }

  async getCurrentEnvironment(): Promise<EnvironmentInfo> {
    return invoke('get_current_environment');
  }

  async clearEnvironment(): Promise<void> {
    return invoke('clear_environment');
  }

  async getAllEnvVars(): Promise<Record<string, string>> {
    return invoke('get_all_env_vars');
  }

  // 验证
  async validateProviderConnection(baseUrl: string, authToken: string): Promise<ConnectionTest> {
    return invoke('validate_provider_connection', { baseUrl, authToken });
  }

  async validateProviderFull(
    providerId: string,
    baseUrl: string,
    authToken: string,
    model: string
  ): Promise<ValidationResult> {
    return invoke('validate_provider_full', { providerId, baseUrl, authToken, model });
  }

  async validateUrlFormat(url: string): Promise<void> {
    return invoke('validate_url_format', { url });
  }

  async validateAuthTokenFormat(token: string): Promise<void> {
    return invoke('validate_auth_token_format', { token });
  }

  async validateModelName(model: string): Promise<void> {
    return invoke('validate_model_name', { model });
  }

  // 启动器
  async launchClaudeCode(config: LaunchConfig): Promise<ProcessInfo> {
    return invoke('launch_claude_code', { config });
  }

  async getProcessStatus(sessionId: string): Promise<ProcessStatus> {
    return invoke('get_process_status', { sessionId });
  }

  async terminateProcess(sessionId: string): Promise<void> {
    return invoke('terminate_process', { sessionId });
  }

  async listActiveProcesses(): Promise<string[]> {
    return invoke('list_active_processes');
  }

  async cleanupFinishedProcesses(): Promise<string[]> {
    return invoke('cleanup_finished_processes');
  }

  async getSystemInfo(): Promise<Record<string, string>> {
    return invoke('get_system_info');
  }

  async openFileManager(path?: string): Promise<void> {
    return invoke('open_file_manager', { path });
  }

  async openUrl(url: string): Promise<void> {
    return invoke('open_url', { url });
  }
}

export const api = new ApiService();
export default api;