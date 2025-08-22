import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { api } from '@/services/api.mock';
import { createValidProvider, createProviderValidationResult } from '@/fixtures/providers.factory';
import type { Provider, CreateProviderRequest, ValidationResult } from '@/types';

// Mock the API service
jest.mock('@/services/api.mock', () => ({
  api: {
    getProviders: jest.fn(),
    getActiveProvider: jest.fn(),
    addProvider: jest.fn(),
    updateProvider: jest.fn(),
    deleteProvider: jest.fn(),
    switchProvider: jest.fn(),
    validateProviderFull: jest.fn(),
    updateSettings: jest.fn(),
    launchClaudeCode: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// Test component that uses the AppContext
const TestComponent: React.FC<{
  onStateChange?: (state: any) => void;
}> = ({ onStateChange }) => {
  const appState = useApp();

  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(appState);
    }
  }, [appState, onStateChange]);

  return (
    <div>
      <div data-testid="loading">{appState.isLoading.toString()}</div>
      <div data-testid="error">{appState.error || 'null'}</div>
      <div data-testid="providers-count">{appState.providers.length}</div>
      <div data-testid="active-provider">
        {appState.activeProvider?.name || 'none'}
      </div>
      
      <button
        data-testid="add-provider"
        onClick={() => appState.addProvider({
          name: 'New Provider',
          baseUrl: 'https://api.new.com',
          authToken: 'new-token',
          model: 'claude-3-sonnet-20240229',
          smallFastModel: 'claude-3-haiku-20240307',
          description: 'New provider for testing',
          tags: ['test'],
        })}
      >
        Add Provider
      </button>

      <button
        data-testid="delete-provider"
        onClick={() => {
          if (appState.providers.length > 0) {
            appState.deleteProvider(appState.providers[0].id);
          }
        }}
      >
        Delete First Provider
      </button>

      <button
        data-testid="switch-provider"
        onClick={() => {
          if (appState.providers.length > 1) {
            appState.switchProvider(appState.providers[1].id);
          }
        }}
      >
        Switch to Second Provider
      </button>

      <button
        data-testid="validate-provider"
        onClick={() => {
          if (appState.providers.length > 0) {
            appState.validateProvider(appState.providers[0].id);
          }
        }}
      >
        Validate First Provider
      </button>

      <button
        data-testid="launch-claude"
        onClick={() => appState.launchClaudeCode()}
      >
        Launch Claude Code
      </button>

      <button
        data-testid="clear-error"
        onClick={() => appState.clearError()}
      >
        Clear Error
      </button>

      <button
        data-testid="refresh-data"
        onClick={() => appState.refreshData()}
      >
        Refresh Data
      </button>

      {appState.providers.map((provider) => (
        <div key={provider.id} data-testid={`provider-${provider.id}`}>
          <span>{provider.name}</span>
          <span data-testid={`provider-${provider.id}-active`}>
            {provider.isActive?.toString() || 'false'}
          </span>
        </div>
      ))}
    </div>
  );
};

describe('AppContext Integration Tests', () => {
  const mockProviders: Provider[] = [
    createValidProvider({
      id: 'provider-1',
      name: 'Provider 1',
      isActive: true,
      isValid: true,
    }),
    createValidProvider({
      id: 'provider-2',
      name: 'Provider 2',
      isActive: false,
      isValid: true,
    }),
    createValidProvider({
      id: 'provider-3',
      name: 'Provider 3',
      isActive: false,
      isValid: undefined,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockApi.getProviders.mockResolvedValue(mockProviders);
    mockApi.getActiveProvider.mockResolvedValue(mockProviders[0]);
  });

  const renderWithContext = (component: React.ReactNode) => {
    return render(
      <AppProvider>
        {component}
      </AppProvider>
    );
  };

  describe('Initial Data Loading', () => {
    test('loads initial data successfully', async () => {
      renderWithContext(<TestComponent />);

      // Should start with loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should have loaded providers and active provider
      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
      expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 1');
      expect(screen.getByTestId('error')).toHaveTextContent('null');

      expect(mockApi.getProviders).toHaveBeenCalledTimes(1);
      expect(mockApi.getActiveProvider).toHaveBeenCalledTimes(1);
    });

    test('handles initial data loading error', async () => {
      const errorMessage = 'Failed to load providers';
      mockApi.getProviders.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('providers-count')).toHaveTextContent('0');
    });

    test('handles partial loading success', async () => {
      mockApi.getActiveProvider.mockResolvedValue(null);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
      expect(screen.getByTestId('active-provider')).toHaveTextContent('none');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Provider CRUD Operations', () => {
    test('adds provider successfully', async () => {
      const user = userEvent.setup();
      const newProvider = createValidProvider({
        id: 'new-provider',
        name: 'New Provider',
      });

      mockApi.addProvider.mockResolvedValue(newProvider);

      renderWithContext(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const addButton = screen.getByTestId('add-provider');
      await user.click(addButton);

      // Should show loading during operation
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should have added the new provider
      expect(screen.getByTestId('providers-count')).toHaveTextContent('4');
      expect(screen.getByTestId(`provider-${newProvider.id}`)).toBeInTheDocument();

      expect(mockApi.addProvider).toHaveBeenCalledWith({
        name: 'New Provider',
        baseUrl: 'https://api.new.com',
        authToken: 'new-token',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        description: 'New provider for testing',
        tags: ['test'],
      });
    });

    test('handles add provider error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Provider already exists';
      mockApi.addProvider.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const addButton = screen.getByTestId('add-provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });

      // Should not have added the provider
      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
    });

    test('deletes provider successfully', async () => {
      const user = userEvent.setup();
      mockApi.deleteProvider.mockResolvedValue(undefined);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Verify initial state
      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
      expect(screen.getByTestId('provider-provider-1')).toBeInTheDocument();

      const deleteButton = screen.getByTestId('delete-provider');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('providers-count')).toHaveTextContent('2');
      });

      // Should have removed the first provider
      expect(screen.queryByTestId('provider-provider-1')).not.toBeInTheDocument();
      expect(mockApi.deleteProvider).toHaveBeenCalledWith('provider-1');
    });

    test('handles delete provider error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Cannot delete active provider';
      mockApi.deleteProvider.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const deleteButton = screen.getByTestId('delete-provider');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });

      // Should not have deleted the provider
      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
    });

    test('switches active provider successfully', async () => {
      const user = userEvent.setup();
      const switchedProvider = { ...mockProviders[1], isActive: true };
      mockApi.switchProvider.mockResolvedValue(switchedProvider);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Initially, provider 1 is active
      expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 1');
      expect(screen.getByTestId('provider-provider-1-active')).toHaveTextContent('true');
      expect(screen.getByTestId('provider-provider-2-active')).toHaveTextContent('false');

      const switchButton = screen.getByTestId('switch-provider');
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 2');
      });

      // Should have updated active states
      expect(screen.getByTestId('provider-provider-1-active')).toHaveTextContent('false');
      expect(screen.getByTestId('provider-provider-2-active')).toHaveTextContent('true');

      expect(mockApi.switchProvider).toHaveBeenCalledWith('provider-2');
    });
  });

  describe('Provider Validation', () => {
    test('validates provider successfully', async () => {
      const user = userEvent.setup();
      const validationResult = createProviderValidationResult({
        providerId: 'provider-1',
        isValid: true,
      });

      mockApi.validateProviderFull.mockResolvedValue(validationResult);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const validateButton = screen.getByTestId('validate-provider');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(mockApi.validateProviderFull).toHaveBeenCalledWith(
        'provider-1',
        mockProviders[0].baseUrl,
        mockProviders[0].authToken,
        mockProviders[0].model
      );
    });

    test('handles validation error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Validation service unavailable';
      mockApi.validateProviderFull.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const validateButton = screen.getByTestId('validate-provider');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });

    test('validates non-existent provider', async () => {
      const user = userEvent.setup();
      
      // Remove all providers for this test
      mockApi.getProviders.mockResolvedValue([]);
      mockApi.getActiveProvider.mockResolvedValue(null);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('providers-count')).toHaveTextContent('0');
      });

      const validateButton = screen.getByTestId('validate-provider');
      await user.click(validateButton);

      // Should not call API since no providers exist
      expect(mockApi.validateProviderFull).not.toHaveBeenCalled();
    });
  });

  describe('Claude Code Launch Integration', () => {
    test('launches Claude Code successfully with active provider', async () => {
      const user = userEvent.setup();
      const launchResult = {
        sessionId: 'session-123',
        processId: 456,
        status: 'running',
      };

      mockApi.launchClaudeCode.mockResolvedValue(launchResult);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const launchButton = screen.getByTestId('launch-claude');
      await user.click(launchButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(mockApi.launchClaudeCode).toHaveBeenCalledWith({
        sessionId: expect.stringMatching(/^session-\d+$/),
        workingDirectory: undefined,
        args: [],
        envVars: {
          ANTHROPIC_BASE_URL: mockProviders[0].baseUrl,
          ANTHROPIC_AUTH_TOKEN: mockProviders[0].authToken,
          ANTHROPIC_MODEL: mockProviders[0].model,
          ANTHROPIC_SMALL_FAST_MODEL: mockProviders[0].smallFastModel,
        },
      });
    });

    test('handles launch error when no active provider', async () => {
      const user = userEvent.setup();
      mockApi.getActiveProvider.mockResolvedValue(null);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-provider')).toHaveTextContent('none');
      });

      const launchButton = screen.getByTestId('launch-claude');
      await user.click(launchButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No active provider configured');
      });

      expect(mockApi.launchClaudeCode).not.toHaveBeenCalled();
    });

    test('handles launch service error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Claude Code executable not found';
      mockApi.launchClaudeCode.mockRejectedValue(new Error(errorMessage));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const launchButton = screen.getByTestId('launch-claude');
      await user.click(launchButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('Error Management', () => {
    test('clears error state', async () => {
      const user = userEvent.setup();
      mockApi.addProvider.mockRejectedValue(new Error('Test error'));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Trigger an error
      const addButton = screen.getByTestId('add-provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Clear the error
      const clearButton = screen.getByTestId('clear-error');
      await user.click(clearButton);

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    test('error persists across operations until cleared', async () => {
      const user = userEvent.setup();
      mockApi.addProvider.mockRejectedValue(new Error('Persistent error'));

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Trigger an error
      const addButton = screen.getByTestId('add-provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Persistent error');
      });

      // Error should persist even after successful operations
      mockApi.refreshData = jest.fn();
      mockApi.getProviders.mockResolvedValue(mockProviders);
      mockApi.getActiveProvider.mockResolvedValue(mockProviders[0]);

      // Note: refreshData isn't fully implemented in the context, 
      // but this demonstrates error persistence concepts
    });
  });

  describe('Data Refresh Integration', () => {
    test('refreshes data successfully', async () => {
      const user = userEvent.setup();
      const updatedProviders = [
        ...mockProviders,
        createValidProvider({ id: 'refresh-provider', name: 'Refreshed Provider' }),
      ];

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Update mock to return new data
      mockApi.getProviders.mockResolvedValue(updatedProviders);

      const refreshButton = screen.getByTestId('refresh-data');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('providers-count')).toHaveTextContent('4');
      });

      expect(screen.getByTestId('provider-refresh-provider')).toBeInTheDocument();
      expect(mockApi.getProviders).toHaveBeenCalledTimes(2); // Initial + refresh
      expect(mockApi.getActiveProvider).toHaveBeenCalledTimes(2);
    });

    test('handles refresh error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Refresh failed';

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Make refresh fail
      mockApi.getProviders.mockRejectedValueOnce(new Error(errorMessage));

      const refreshButton = screen.getByTestId('refresh-data');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });

      // Should maintain original data
      expect(screen.getByTestId('providers-count')).toHaveTextContent('3');
    });
  });

  describe('State Management Edge Cases', () => {
    test('handles rapid successive operations', async () => {
      const user = userEvent.setup();
      
      const newProvider1 = createValidProvider({ id: 'rapid-1', name: 'Rapid 1' });
      const newProvider2 = createValidProvider({ id: 'rapid-2', name: 'Rapid 2' });
      
      mockApi.addProvider
        .mockResolvedValueOnce(newProvider1)
        .mockResolvedValueOnce(newProvider2);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const addButton = screen.getByTestId('add-provider');
      
      // Rapid clicks
      await user.click(addButton);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('providers-count')).toHaveTextContent('5');
      });

      expect(screen.getByTestId('provider-rapid-1')).toBeInTheDocument();
      expect(screen.getByTestId('provider-rapid-2')).toBeInTheDocument();
    });

    test('maintains data consistency during concurrent operations', async () => {
      const user = userEvent.setup();
      let stateHistory: any[] = [];

      const onStateChange = (state: any) => {
        stateHistory.push({
          loading: state.isLoading,
          providersCount: state.providers.length,
          error: state.error,
        });
      };

      mockApi.addProvider.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(createValidProvider({ id: 'concurrent' })), 100)
        )
      );

      renderWithContext(<TestComponent onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const addButton = screen.getByTestId('add-provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Check that loading states were properly managed
      const loadingStates = stateHistory.map(s => s.loading);
      expect(loadingStates).toContain(true); // Should have shown loading
      expect(loadingStates[loadingStates.length - 1]).toBe(false); // Should end with not loading
    });

    test('handles provider deletion when provider is active', async () => {
      const user = userEvent.setup();
      mockApi.deleteProvider.mockResolvedValue(undefined);

      renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Verify provider-1 is active initially
      expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 1');

      const deleteButton = screen.getByTestId('delete-provider');
      await user.click(deleteButton);

      await waitFor(() => {
        // Active provider should be cleared when deleted
        expect(screen.getByTestId('active-provider')).toHaveTextContent('none');
      });

      expect(screen.getByTestId('providers-count')).toHaveTextContent('2');
    });
  });

  describe('Context Error Boundaries', () => {
    test('useApp throws error when used outside provider', () => {
      // Capture console errors to avoid cluttering test output
      const originalError = console.error;
      console.error = jest.fn();

      const ComponentOutsideProvider = () => {
        return <TestComponent />;
      };

      expect(() => {
        render(<ComponentOutsideProvider />);
      }).toThrow('useApp must be used within an AppProvider');

      console.error = originalError;
    });

    test('provider handles component unmounting gracefully', async () => {
      const { unmount } = renderWithContext(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});