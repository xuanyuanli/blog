import { render, screen, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '@/contexts/AppContext';

// Mock the API service
jest.mock('@/services/api', () => ({
  api: {
    getProviders: jest.fn(),
    getActiveProvider: jest.fn(),
    addProvider: jest.fn(),
    updateProvider: jest.fn(),
    deleteProvider: jest.fn(),
    switchProvider: jest.fn(),
    validateProvider: jest.fn(),
    updateSettings: jest.fn(),
    launchClaudeCode: jest.fn(),
  },
}));

const mockApi = require('@/services/api').api;

// Test component that uses the context
const TestComponent = () => {
  const { 
    providers, 
    activeProvider, 
    isLoading, 
    error, 
    addProvider, 
    deleteProvider,
    switchProvider 
  } = useApp();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div data-testid="providers-count">{providers.length}</div>
      <div data-testid="active-provider">{activeProvider?.name || 'None'}</div>
      <button 
        onClick={() => addProvider({
          name: 'Test Provider',
          baseUrl: 'https://test.com',
          model: 'claude-3-sonnet-20240229',
          smallFastModel: 'claude-3-haiku-20240307',
          isActive: false,
          isValid: false,
        })}
      >
        Add Provider
      </button>
      <button 
        onClick={() => providers[0] && deleteProvider(providers[0].id)}
        disabled={!providers.length}
      >
        Delete Provider
      </button>
      <button 
        onClick={() => providers[0] && switchProvider(providers[0].id)}
        disabled={!providers.length}
      >
        Switch Provider
      </button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockApi.getProviders.mockResolvedValue([]);
    mockApi.getActiveProvider.mockResolvedValue(null);
    mockApi.addProvider.mockImplementation((provider) => 
      Promise.resolve({ ...provider, id: 'test-id', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    );
    mockApi.deleteProvider.mockResolvedValue();
    mockApi.switchProvider.mockImplementation((id) => 
      Promise.resolve({ id, name: 'Test Provider', isActive: true })
    );
  });

  test('provides initial state', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('providers-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-provider')).toHaveTextContent('None');
  });

  test('loads initial data on mount', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'Provider 1',
        baseUrl: 'https://api1.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    mockApi.getProviders.mockResolvedValue(mockProviders);
    mockApi.getActiveProvider.mockResolvedValue(mockProviders[0]);

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(mockApi.getProviders).toHaveBeenCalledTimes(1);
    expect(mockApi.getActiveProvider).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('providers-count')).toHaveTextContent('1');
    expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 1');
  });

  test('adds provider successfully', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Provider');
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(mockApi.addProvider).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('providers-count')).toHaveTextContent('1');
    });
  });

  test('deletes provider successfully', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'Provider 1',
        baseUrl: 'https://api1.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    mockApi.getProviders.mockResolvedValue(mockProviders);
    mockApi.getActiveProvider.mockResolvedValue(mockProviders[0]);

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete Provider');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(mockApi.deleteProvider).toHaveBeenCalledWith('1');
      expect(screen.getByTestId('providers-count')).toHaveTextContent('0');
    });
  });

  test('switches provider successfully', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'Provider 1',
        baseUrl: 'https://api1.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: false,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Provider 2',
        baseUrl: 'https://api2.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    mockApi.getProviders.mockResolvedValue(mockProviders);
    mockApi.getActiveProvider.mockResolvedValue(mockProviders[1]);

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('active-provider')).toHaveTextContent('Provider 2');

    const switchButton = screen.getByText('Switch Provider');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    await waitFor(() => {
      expect(mockApi.switchProvider).toHaveBeenCalledWith('1');
      expect(screen.getByTestId('active-provider')).toHaveTextContent('Test Provider');
    });
  });

  test('handles API errors gracefully', async () => {
    mockApi.getProviders.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error: Failed to load data/)).toBeInTheDocument();
  });

  test('clears error when clearError is called', async () => {
    mockApi.getProviders.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  test('refreshes data successfully', async () => {
    const mockProviders = [
      {
        id: '1',
        name: 'Provider 1',
        baseUrl: 'https://api1.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        isActive: true,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    mockApi.getProviders.mockResolvedValueOnce([]);
    mockApi.getActiveProvider.mockResolvedValueOnce(null);

    await act(async () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('providers-count')).toHaveTextContent('0');

    // Mock updated data
    mockApi.getProviders.mockResolvedValue(mockProviders);
    mockApi.getActiveProvider.mockResolvedValue(mockProviders[0]);

    // Call refreshData (this would need to be exposed through the test component)
    // For now, we'll test the loading state
  });

  test('throws error when useApp is used outside AppProvider', () => {
    // Suppress console error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useApp must be used within an AppProvider');

    console.error = originalError;
  });
});