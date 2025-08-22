import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '@/services/api.mock';
import type { AppContextType, AppState, Provider, CreateProviderRequest, UpdateProviderRequest, ValidationResult, LaunchConfig } from '@/types';

const initialState: AppState = {
  providers: [],
  activeProvider: null,
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
    notifications: {
      enabled: true,
      showValidationResults: true,
      showProviderSwitch: true,
      showLaunchStatus: true,
      showErrors: true,
      soundEnabled: false,
    },
    security: {
      requireConfirmationForDelete: true,
      requireConfirmationForSwitch: true,
      clearClipboardOnExit: false,
      logSensitiveOperations: true,
    },
  },
  isLoading: false,
  error: null,
};

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DATA_SUCCESS'; payload: { providers: Provider[]; activeProvider: Provider | null; settings: any } }
  | { type: 'ADD_PROVIDER_SUCCESS'; payload: Provider }
  | { type: 'UPDATE_PROVIDER_SUCCESS'; payload: Provider }
  | { type: 'DELETE_PROVIDER_SUCCESS'; payload: string }
  | { type: 'SWITCH_PROVIDER_SUCCESS'; payload: Provider }
  | { type: 'UPDATE_SETTINGS_SUCCESS'; payload: any }
  | { type: 'VALIDATE_PROVIDER_SUCCESS'; payload: { providerId: string; result: ValidationResult } }
  | { type: 'CLEAR_ERROR' };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOAD_DATA_SUCCESS':
      return {
        ...state,
        providers: action.payload.providers,
        activeProvider: action.payload.activeProvider,
        settings: action.payload.settings,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_PROVIDER_SUCCESS':
      return {
        ...state,
        providers: [...state.providers, action.payload],
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_PROVIDER_SUCCESS':
      return {
        ...state,
        providers: state.providers.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        activeProvider: state.activeProvider?.id === action.payload.id 
          ? action.payload 
          : state.activeProvider,
        isLoading: false,
        error: null,
      };
    
    case 'DELETE_PROVIDER_SUCCESS':
      const filteredProviders = state.providers.filter(p => p.id !== action.payload);
      return {
        ...state,
        providers: filteredProviders,
        activeProvider: state.activeProvider?.id === action.payload 
          ? null 
          : state.activeProvider,
        isLoading: false,
        error: null,
      };
    
    case 'SWITCH_PROVIDER_SUCCESS':
      return {
        ...state,
        activeProvider: action.payload,
        providers: state.providers.map(p => ({
          ...p,
          isActive: p.id === action.payload.id,
        })),
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_SETTINGS_SUCCESS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        isLoading: false,
        error: null,
      };
    
    case 'VALIDATE_PROVIDER_SUCCESS':
      return {
        ...state,
        providers: state.providers.map(p => 
          p.id === action.payload.providerId 
            ? { 
                ...p, 
                isValid: action.payload.result.isValid,
                lastValidated: new Date().toISOString(),
              }
            : p
        ),
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const [providers, activeProvider] = await Promise.all([
          api.getProviders(),
          api.getActiveProvider(),
        ]);
        
        dispatch({
          type: 'LOAD_DATA_SUCCESS',
          payload: {
            providers,
            activeProvider,
            settings: initialState.settings, // TODO: 从API加载设置
          },
        });
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load data' 
        });
      }
    };

    loadInitialData();
  }, []);

  // Provider actions
  const addProvider = async (provider: CreateProviderRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newProvider = await api.addProvider(provider);
      dispatch({ type: 'ADD_PROVIDER_SUCCESS', payload: newProvider });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to add provider' 
      });
      throw error;
    }
  };

  const updateProvider = async (id: string, updates: UpdateProviderRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedProvider = await api.updateProvider(id, updates);
      dispatch({ type: 'UPDATE_PROVIDER_SUCCESS', payload: updatedProvider });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update provider' 
      });
      throw error;
    }
  };

  const deleteProvider = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await api.deleteProvider(id);
      dispatch({ type: 'DELETE_PROVIDER_SUCCESS', payload: id });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to delete provider' 
      });
      throw error;
    }
  };

  const switchProvider = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const switchedProvider = await api.switchProvider(id);
      dispatch({ type: 'SWITCH_PROVIDER_SUCCESS', payload: switchedProvider });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to switch provider' 
      });
      throw error;
    }
  };

  const validateProvider = async (id: string): Promise<ValidationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const provider = state.providers.find(p => p.id === id);
      if (!provider) {
        throw new Error('Provider not found');
      }
      
      const result = await api.validateProviderFull(
        id,
        provider.baseUrl,
        provider.authToken || '',
        provider.model
      );
      
      dispatch({ 
        type: 'VALIDATE_PROVIDER_SUCCESS', 
        payload: { providerId: id, result } 
      });
      
      return result;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to validate provider' 
      });
      throw error;
    }
  };

  // Settings actions
  const updateSettings = async (settings: Partial<any>): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await api.updateSettings({ ...state.settings, ...settings });
      dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: settings });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update settings' 
      });
      throw error;
    }
  };

  // System actions
  const launchClaudeCode = async (config?: Partial<LaunchConfig>): Promise<any> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (!state.activeProvider) {
        throw new Error('No active provider configured');
      }
      
      const launchConfig: LaunchConfig = {
        sessionId: `session-${Date.now()}`,
        workingDirectory: config?.workingDirectory,
        args: config?.args || [],
        envVars: {
          ANTHROPIC_BASE_URL: state.activeProvider.baseUrl,
          ANTHROPIC_AUTH_TOKEN: state.activeProvider.authToken || '',
          ANTHROPIC_MODEL: state.activeProvider.model,
          ANTHROPIC_SMALL_FAST_MODEL: state.activeProvider.smallFastModel,
          ...config?.envVars,
        },
      };
      
      const result = await api.launchClaudeCode(launchConfig);
      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to launch Claude Code' 
      });
      throw error;
    }
  };

  // Utility actions
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [providers, activeProvider] = await Promise.all([
        api.getProviders(),
        api.getActiveProvider(),
      ]);
      
      dispatch({
        type: 'LOAD_DATA_SUCCESS',
        payload: {
          providers,
          activeProvider,
          settings: state.settings,
        },
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to refresh data' 
      });
    }
  };

  const contextValue: AppContextType = {
    ...state,
    addProvider,
    updateProvider,
    deleteProvider,
    switchProvider,
    validateProvider,
    updateSettings,
    launchClaudeCode,
    clearError,
    refreshData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};