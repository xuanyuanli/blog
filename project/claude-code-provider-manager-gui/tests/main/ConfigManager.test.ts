import { ConfigManager } from '@/main/config/ConfigManager';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock app module
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(),
    getVersion: jest.fn(),
  },
}));

const mockApp = require('electron').app;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockUserDataPath: string;
  let mockConfigPath: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserDataPath = '/tmp/user-data';
    mockConfigPath = path.join(mockUserDataPath, 'config.json');
    
    mockApp.getPath.mockReturnValue(mockUserDataPath);
    mockApp.getVersion.mockReturnValue('1.0.0');
    
    // Reset fs mocks
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.unlinkSync.mockReturnValue(undefined);
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.statSync.mockReturnValue({
      mtime: new Date(),
      birthtime: new Date(),
    } as any);
    
    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    test('initializes with default config', () => {
      const defaultConfig = configManager['getDefaultConfig']();
      const config = configManager.getConfig();
      
      expect(config).toEqual(defaultConfig);
    });

    test('ensures directories exist', () => {
      new ConfigManager();
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(mockUserDataPath, 'backups'),
        { recursive: true, mode: 0o700 }
      );
    });
  });

  describe('loadConfig', () => {
    test('creates default config when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const config = await configManager.loadConfig();
      
      expect(config).toEqual(configManager['getDefaultConfig']());
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(configManager['getDefaultConfig'](), null, 2)
      );
    });

    test('loads existing config file', async () => {
      const existingConfig = {
        providers: [
          {
            id: 'test-id',
            name: 'Test Provider',
            baseUrl: 'https://test.com',
            model: 'claude-3-sonnet-20240229',
            smallFastModel: 'claude-3-haiku-20240307',
            isActive: true,
            isValid: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        settings: {
          theme: 'dark',
          language: 'en-US',
          autoValidate: false,
          autoStart: true,
          startMinimized: false,
          closeToTray: true,
          startupArgs: [],
          updateCheck: false,
          telemetry: true,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

      const config = await configManager.loadConfig();
      
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0].name).toBe('Test Provider');
      expect(config.settings.theme).toBe('dark');
    });

    test('handles invalid JSON gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const config = await configManager.loadConfig();
      
      expect(config).toEqual(configManager['getDefaultConfig']());
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('validates and cleans config', async () => {
      const invalidConfig = {
        providers: [
          {
            // Missing required fields
            id: 'invalid-provider',
            name: 'Invalid Provider',
          },
          {
            id: 'valid-provider',
            name: 'Valid Provider',
            baseUrl: 'https://valid.com',
            model: 'claude-3-sonnet-20240229',
            smallFastModel: 'claude-3-haiku-20240307',
            isActive: false,
            isValid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        settings: {
          theme: 'invalid-theme', // Should be reset to default
          language: 'zh-CN',
          autoValidate: true,
          autoStart: false,
          startMinimized: false,
          closeToTray: true,
          startupArgs: [],
          updateCheck: true,
          telemetry: false,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      const config = await configManager.loadConfig();
      
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0].id).toBe('valid-provider');
      expect(config.settings.theme).toBe('system'); // Reset to default
    });
  });

  describe('saveConfig', () => {
    test('saves config to file', async () => {
      const config = configManager.getConfig();
      
      await configManager.saveConfig();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(configManager['prepareDataForSave'](), null, 2)
      );
    });

    test('creates backup before saving', async () => {
      await configManager.saveConfig();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2); // Backup + config
    });

    test('handles save errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      await expect(configManager.saveConfig()).rejects.toThrow('Write failed');
    });
  });

  describe('provider management', () => {
    beforeEach(async () => {
      await configManager.loadConfig();
    });

    test('adds provider successfully', async () => {
      const providerData = {
        name: 'New Provider',
        baseUrl: 'https://new.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: false,
        isValid: false,
      };

      const newProvider = await configManager.addProvider(providerData);
      
      expect(newProvider.id).toBeDefined();
      expect(newProvider.name).toBe('New Provider');
      expect(newProvider.createdAt).toBeDefined();
      expect(newProvider.updatedAt).toBeDefined();
      
      const config = configManager.getConfig();
      expect(config.providers).toHaveLength(1);
    });

    test('updates provider successfully', async () => {
      // Add a provider first
      const provider = await configManager.addProvider({
        name: 'Test Provider',
        baseUrl: 'https://test.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: false,
        isValid: false,
      });

      // Update the provider
      await configManager.updateProvider(provider.id, {
        name: 'Updated Provider',
        isActive: true,
      });

      const config = configManager.getConfig();
      const updatedProvider = config.providers.find(p => p.id === provider.id);
      
      expect(updatedProvider).toBeDefined();
      expect(updatedProvider?.name).toBe('Updated Provider');
      expect(updatedProvider?.isActive).toBe(true);
      expect(updatedProvider?.updatedAt).not.toBe(provider.createdAt);
    });

    test('deletes provider successfully', async () => {
      // Add a provider first
      const provider = await configManager.addProvider({
        name: 'Test Provider',
        baseUrl: 'https://test.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
      });

      // Delete the provider
      await configManager.deleteProvider(provider.id);

      const config = configManager.getConfig();
      expect(config.providers).toHaveLength(0);
    });

    test('throws error when updating non-existent provider', async () => {
      await expect(
        configManager.updateProvider('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Provider not found');
    });

    test('sets active provider successfully', async () => {
      // Add multiple providers
      const provider1 = await configManager.addProvider({
        name: 'Provider 1',
        baseUrl: 'https://test1.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: false,
        isValid: true,
      });

      const provider2 = await configManager.addProvider({
        name: 'Provider 2',
        baseUrl: 'https://test2.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: false,
        isValid: true,
      });

      // Set provider 2 as active
      await configManager.setActiveProvider(provider2.id);

      const config = configManager.getConfig();
      expect(config.providers[0].isActive).toBe(false);
      expect(config.providers[1].isActive).toBe(true);
    });
  });

  describe('settings management', () => {
    beforeEach(async () => {
      await configManager.loadConfig();
    });

    test('updates settings successfully', async () => {
      await configManager.updateSettings({
        theme: 'dark',
        language: 'en-US',
        autoStart: true,
      });

      const config = configManager.getConfig();
      expect(config.settings.theme).toBe('dark');
      expect(config.settings.language).toBe('en-US');
      expect(config.settings.autoStart).toBe(true);
    });

    test('merges settings with existing ones', async () => {
      await configManager.updateSettings({
        theme: 'dark',
      });

      await configManager.updateSettings({
        language: 'en-US',
      });

      const config = configManager.getConfig();
      expect(config.settings.theme).toBe('dark');
      expect(config.settings.language).toBe('en-US');
    });
  });

  describe('backup management', () => {
    test('creates backup with timestamp', async () => {
      const backupPath = await configManager.createBackup();
      
      expect(backupPath).toMatch(/config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json$/);
    });

    test('restores config from backup', async () => {
      // Create a backup with specific data
      const backupData = {
        providers: [
          {
            id: 'backup-provider',
            name: 'Backup Provider',
            baseUrl: 'https://backup.com',
            model: 'claude-3-sonnet-20240229',
            smallFastModel: 'claude-3-haiku-20240307',
            isActive: true,
            isValid: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        settings: {
          theme: 'light',
          language: 'zh-CN',
          autoValidate: true,
          autoStart: false,
          startMinimized: false,
          closeToTray: true,
          startupArgs: [],
          updateCheck: true,
          telemetry: false,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(backupData));

      await configManager.restoreConfig('config-backup.json');

      const config = configManager.getConfig();
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0].name).toBe('Backup Provider');
      expect(config.settings.theme).toBe('light');
    });

    test('throws error when restoring non-existent backup', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        configManager.restoreConfig('non-existent.json')
      ).rejects.toThrow('Backup file not found');
    });
  });

  describe('import/export', () => {
    test('exports config without sensitive data', async () => {
      // Add a provider with auth token
      await configManager.addProvider({
        name: 'Secret Provider',
        baseUrl: 'https://secret.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
        authToken: 'secret-token',
      });

      const exportData = configManager['prepareDataForExport']();
      
      expect(exportData.providers[0].authToken).toBeUndefined();
    });

    test('imports config and validates data', async () => {
      const importData = {
        providers: [
          {
            id: 'import-provider',
            name: 'Import Provider',
            baseUrl: 'https://import.com',
            model: 'claude-3-sonnet-20240229',
            smallFastModel: 'claude-3-haiku-20240307',
            isActive: true,
            isValid: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
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
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(importData));

      await configManager.importConfig('import.json');

      const config = configManager.getConfig();
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0].name).toBe('Import Provider');
    });

    test('throws error when importing invalid data', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(
        configManager.importConfig('invalid.json')
      ).rejects.toThrow('Invalid configuration data');
    });
  });
});