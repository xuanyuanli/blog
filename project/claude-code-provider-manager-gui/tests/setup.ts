import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock electron APIs
const mockElectron = {
  app: {
    getPath: jest.fn(),
    getVersion: jest.fn(),
    getName: jest.fn(),
    setLoginItemSettings: jest.fn(),
    isDefaultProtocolClient: jest.fn(),
    setAsDefaultProtocolClient: jest.fn(),
    removeAsDefaultProtocolClient: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn(),
    quit: jest.fn(),
    relaunch: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    focus: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    restore: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      openDevTools: jest.fn(),
      toggleDevTools: jest.fn(),
    },
    isDestroyed: jest.fn(() => false),
    isVisible: jest.fn(() => true),
    isMinimized: jest.fn(() => false),
    isMaximized: jest.fn(() => false),
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeAllListeners: jest.fn(),
    send: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },
  Tray: jest.fn().mockImplementation(() => ({
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
    setImage: jest.fn(),
    popUpContextMenu: jest.fn(),
    displayBalloon: jest.fn(),
    setHighlightMode: jest.fn(),
  })),
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
    showItemInFolder: jest.fn(),
  },
  globalShortcut: {
    register: jest.fn(),
    unregister: jest.fn(),
    unregisterAll: jest.fn(),
    isRegistered: jest.fn(),
  },
  Notification: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
  })),
  nativeImage: {
    createFromPath: jest.fn(),
    createFromDataURL: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: jest.fn(),
    getAllDisplays: jest.fn(),
  },
  powerMonitor: {
    on: jest.fn(),
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn(),
      },
    },
  },
  crashReporter: {
    start: jest.fn(),
  },
  autoUpdater: {
    checkForUpdates: jest.fn(),
    on: jest.fn(),
    quitAndInstall: jest.fn(),
  },
};

// Mock keytar
const mockKeytar = {
  getPassword: jest.fn(),
  setPassword: jest.fn(),
  deletePassword: jest.fn(),
  findCredentials: jest.fn(),
  findPassword: jest.fn(),
};

// Mock electron-is-dev
const mockIsDev = jest.fn(() => false);

// Set up mocks
jest.mock('electron', () => mockElectron);
jest.mock('keytar', () => mockKeytar);
jest.mock('electron-is-dev', () => mockIsDev);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Setup global test utilities
global.beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
  
  // Setup default mock implementations
  mockElectron.app.getPath.mockImplementation((name) => {
    const paths = {
      userData: '/tmp/user-data',
      temp: '/tmp',
      home: '/home/user',
      appData: '/tmp/app-data',
      logs: '/tmp/logs',
    };
    return paths[name] || '/tmp';
  });
  
  mockElectron.app.getVersion.mockReturnValue('1.0.0');
  mockElectron.app.getName.mockReturnValue('Claude Code Provider Manager');
  
  mockElectron.BrowserWindow.mockImplementation(() => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    focus: jest.fn(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    restore: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      openDevTools: jest.fn(),
      toggleDevTools: jest.fn(),
    },
    isDestroyed: jest.fn(() => false),
    isVisible: jest.fn(() => true),
    isMinimized: jest.fn(() => false),
    isMaximized: jest.fn(() => false),
  }));
});

// Global test utilities
global.testUtils = {
  // Create mock provider config
  createMockProvider: (overrides = {}) => ({
    id: 'test-provider-id',
    name: 'Test Provider',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-sonnet-20240229',
    smallFastModel: 'claude-3-haiku-20240307',
    isActive: true,
    isValid: true,
    lastValidated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  // Create mock config
  createMockConfig: (overrides = {}) => ({
    providers: [],
    settings: {
      theme: 'system',
      language: 'zh-CN',
      autoValidate: true,
      autoStart: false,
      startMinimized: false,
      closeToTray: true,
      startupArgs: [],
      updateCheck: true,
      telemetry: false,
    },
    security: {
      encryptSensitiveData: true,
      requireConfirmationForDelete: true,
      requireConfirmationForSwitch: true,
      clearClipboardOnExit: false,
      logSensitiveOperations: true,
      sessionTimeout: 3600000,
    },
    ui: {
      notifications: {
        enabled: true,
        showValidationResults: true,
        showProviderSwitch: true,
        showLaunchStatus: true,
        showErrors: true,
        soundEnabled: false,
      },
      appearance: {
        fontSize: 'medium',
        fontFamily: 'system-ui',
        accentColor: '#3b82f6',
        compactMode: false,
        showStatusBar: true,
        showSidebar: true,
      },
      behavior: {
        autoHideSidebar: false,
        autoRefresh: true,
        refreshInterval: 30000,
        rememberLastProvider: true,
        confirmOnExit: false,
      },
    },
    advanced: {
      debugMode: false,
      logLevel: 'info',
      maxLogFiles: 10,
      logRetentionDays: 30,
      customEnvironment: {},
      networkSettings: {
        proxyEnabled: false,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
    },
    ...overrides,
  }),

  // Create mock validation result
  createMockValidationResult: (overrides = {}) => ({
    providerId: 'test-provider-id',
    isValid: true,
    connectionStatus: 'success',
    authStatus: 'success',
    modelStatus: 'available',
    errors: [],
    warnings: [],
    latency: 150,
    testedAt: new Date().toISOString(),
    ...overrides,
  }),

  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock successful fetch response
  mockFetchResponse: (data: any, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  },

  // Mock failed fetch response
  mockFetchError: (error: string) => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error));
  },
};

// Console error suppression for clean test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific console outputs during tests
  console.error = (...args) => {
    if (!args[0]?.includes?.('Not implemented:') && 
        !args[0]?.includes?.('Failed to load') &&
        !args[0]?.includes?.('Mock')) {
      originalError(...args);
    }
  };
  
  console.warn = (...args) => {
    if (!args[0]?.includes?.('Not implemented:') && 
        !args[0]?.includes?.('deprecated')) {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// Export mocks for test files
(global as any).mockElectron = mockElectron;
(global as any).mockKeytar = mockKeytar;
(global as any).mockIsDev = mockIsDev;