// 提供商相关类型
export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  authToken?: string;
  model: string;
  smallFastModel: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  tags?: string[];
  description?: string;
}

export interface CreateProviderRequest {
  name: string;
  baseUrl: string;
  authToken: string;
  model: string;
  smallFastModel: string;
  tags?: string[];
  description?: string;
}

export interface UpdateProviderRequest {
  name?: string;
  baseUrl?: string;
  authToken?: string;
  model?: string;
  smallFastModel?: string;
  tags?: string[];
  description?: string;
}

// 配置相关类型
export interface Configuration {
  version: string;
  activeProviderId: string | null;
  providers: Provider[];
  settings: AppSettings;
  metadata: ConfigMetadata;
}

export interface ConfigMetadata {
  configVersion: string;
  lastModified: string;
  backupEnabled: boolean;
  encryptionEnabled: boolean;
  createdAt: string;
}

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoValidate: boolean;
  autoStart: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  claudeCodePath?: string;
  defaultWorkingDirectory?: string;
  startupArgs: string[];
  updateCheck: boolean;
  telemetry: boolean;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  showValidationResults: boolean;
  showProviderSwitch: boolean;
  showLaunchStatus: boolean;
  showErrors: boolean;
  soundEnabled: boolean;
}

export interface SecuritySettings {
  autoLockTimeout?: number;
  requireConfirmationForDelete: boolean;
  requireConfirmationForSwitch: boolean;
  clearClipboardOnExit: boolean;
  logSensitiveOperations: boolean;
}

// 验证相关类型
export interface ValidationResult {
  providerId: string;
  isValid: boolean;
  connectionStatus: string;
  authStatus: string;
  modelStatus: string;
  errors: string[];
  warnings: string[];
  latency?: number;
  testedAt: string;
}

export interface ConnectionTest {
  status: string;
  latency?: number;
  responseCode?: number;
  errorMessage?: string;
}

// 环境相关类型
export interface EnvironmentInfo {
  baseUrl?: string;
  model?: string;
  smallFastModel?: string;
  providerName?: string;
  isAuthenticated: boolean;
  lastValidated?: string;
}

// 启动器相关类型
export interface LaunchConfig {
  sessionId: string;
  workingDirectory?: string;
  args: string[];
  envVars: Record<string, string>;
}

export interface ProcessInfo {
  pid: number;
  sessionId: string;
  startedAt: string;
  status: ProcessStatus;
}

export type ProcessStatus = 'running' | 'stopped' | { error: string };

// UI 相关类型
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// 状态管理类型
export interface AppState {
  providers: Provider[];
  activeProvider: Provider | null;
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

export interface AppContextType extends AppState {
  // Provider actions
  addProvider: (provider: CreateProviderRequest) => Promise<void>;
  updateProvider: (id: string, updates: UpdateProviderRequest) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  switchProvider: (id: string) => Promise<void>;
  validateProvider: (id: string) => Promise<ValidationResult>;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // System actions
  launchClaudeCode: (config?: Partial<LaunchConfig>) => Promise<ProcessInfo>;
  
  // Utility actions
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// 通知类型
export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// 表单类型
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// 路由类型
export type RouteParams = {
  id?: string;
};

// 主题类型
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}