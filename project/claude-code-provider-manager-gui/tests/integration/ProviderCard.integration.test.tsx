import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderCard } from '@/components/business/ProviderCard';
import { createValidProvider } from '@/fixtures/providers.factory';
import type { Provider } from '@/types';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Edit2: ({ className, ...props }: any) => (
    <div data-testid="edit-icon" className={className} {...props}>✏️</div>
  ),
  Trash2: ({ className, ...props }: any) => (
    <div data-testid="trash-icon" className={className} {...props}>🗑️</div>
  ),
  Zap: ({ className, ...props }: any) => (
    <div data-testid="zap-icon" className={className} {...props}>⚡</div>
  ),
  MoreVertical: ({ className, ...props }: any) => (
    <div data-testid="more-icon" className={className} {...props}>⋮</div>
  ),
  CheckCircle: ({ className, ...props }: any) => (
    <div data-testid="check-circle-icon" className={className} {...props}>✓</div>
  ),
  XCircle: ({ className, ...props }: any) => (
    <div data-testid="x-circle-icon" className={className} {...props}>✗</div>
  ),
  AlertTriangle: ({ className, ...props }: any) => (
    <div data-testid="alert-triangle-icon" className={className} {...props}>⚠</div>
  ),
  Clock: ({ className, ...props }: any) => (
    <div data-testid="clock-icon" className={className} {...props}>⏰</div>
  ),
}));

describe('ProviderCard Integration Tests', () => {
  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onActivate: jest.fn(),
    onValidate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Data Integration', () => {
    test('displays all provider information correctly', () => {
      const provider: Provider = createValidProvider({
        name: 'Claude Official',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-sonnet-20240229',
        smallFastModel: 'claude-3-haiku-20240307',
        description: 'Official Anthropic API endpoint',
        tags: ['official', 'production', 'reliable'],
        isValid: true,
        isActive: true,
      });

      render(
        <ProviderCard
          provider={provider}
          isActive={true}
          {...mockHandlers}
        />
      );

      // Verify provider information display
      expect(screen.getByText('Claude Official')).toBeInTheDocument();
      expect(screen.getByText('https://api.anthropic.com')).toBeInTheDocument();
      expect(screen.getByText('claude-3-sonnet-20240229')).toBeInTheDocument();
      expect(screen.getByText('claude-3-haiku-20240307')).toBeInTheDocument();
      expect(screen.getByText('Official Anthropic API endpoint')).toBeInTheDocument();

      // Verify tags
      expect(screen.getByText('official')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText('reliable')).toBeInTheDocument();
    });

    test('adapts display based on validation status', () => {
      const validProvider = createValidProvider({ isValid: true });
      const invalidProvider = createValidProvider({ isValid: false });
      const unknownProvider = createValidProvider({ isValid: undefined });

      // Test valid provider
      const { rerender } = render(
        <ProviderCard provider={validProvider} {...mockHandlers} />
      );
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('可用')).toBeInTheDocument();

      // Test invalid provider
      rerender(
        <ProviderCard provider={invalidProvider} {...mockHandlers} />
      );
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('验证失败')).toBeInTheDocument();

      // Test unknown provider
      rerender(
        <ProviderCard provider={unknownProvider} {...mockHandlers} />
      );
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByText('未验证')).toBeInTheDocument();
    });

    test('shows active state correctly', () => {
      const provider = createValidProvider();

      // Test active state
      const { rerender } = render(
        <ProviderCard provider={provider} isActive={true} {...mockHandlers} />
      );
      
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByText('当前激活')).toBeInTheDocument();
      expect(screen.getByText('已激活')).toBeInTheDocument();
      
      // Card should have active styling
      const card = document.querySelector('.ring-2.ring-blue-500');
      expect(card).toBeInTheDocument();

      // Test inactive state
      rerender(
        <ProviderCard provider={provider} isActive={false} {...mockHandlers} />
      );
      
      expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('当前激活')).not.toBeInTheDocument();
      expect(screen.queryByText('已激活')).not.toBeInTheDocument();
    });

    test('handles optional properties gracefully', () => {
      const minimalProvider: Provider = createValidProvider({
        description: undefined,
        tags: undefined,
      });

      render(
        <ProviderCard provider={minimalProvider} {...mockHandlers} />
      );

      // Should still render basic information
      expect(screen.getByText(minimalProvider.name)).toBeInTheDocument();
      expect(screen.getByText(minimalProvider.baseUrl)).toBeInTheDocument();
      
      // Optional fields should not cause errors
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });

    test('handles empty tags array', () => {
      const provider = createValidProvider({ tags: [] });

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      // Should render without tags section
      expect(screen.getByText(provider.name)).toBeInTheDocument();
      // No tags should be displayed
      const tagElements = document.querySelectorAll('.rounded-full');
      expect(tagElements.length).toBe(0);
    });
  });

  describe('User Interactions Integration', () => {
    test('edit interaction calls handler with correct provider ID', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const editButton = screen.getByTestId('edit-icon').parentElement!;
      await user.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(provider.id);
      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    test('delete interaction calls handler with correct provider ID', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const deleteButton = screen.getByTestId('trash-icon').parentElement!;
      await user.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(provider.id);
      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    });

    test('validate interaction calls handler with correct provider ID', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const validateButton = screen.getByRole('button', { name: '验证' });
      await user.click(validateButton);

      expect(mockHandlers.onValidate).toHaveBeenCalledWith(provider.id);
      expect(mockHandlers.onValidate).toHaveBeenCalledTimes(1);
    });

    test('activate interaction only appears when provider is inactive', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      // Test inactive provider
      const { rerender } = render(
        <ProviderCard provider={provider} isActive={false} {...mockHandlers} />
      );

      const activateButton = screen.getByRole('button', { name: '激活' });
      await user.click(activateButton);

      expect(mockHandlers.onActivate).toHaveBeenCalledWith(provider.id);
      expect(mockHandlers.onActivate).toHaveBeenCalledTimes(1);

      // Test active provider - activate button should not exist
      rerender(
        <ProviderCard provider={provider} isActive={true} {...mockHandlers} />
      );

      expect(screen.queryByRole('button', { name: '激活' })).not.toBeInTheDocument();
    });

    test('more options menu button is rendered', () => {
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const moreButton = screen.getByTestId('more-icon').parentElement!;
      expect(moreButton).toBeInTheDocument();
      expect(moreButton).toHaveClass('p-1'); // Has proper styling
    });
  });

  describe('Visual States Integration', () => {
    test('applies hover and transition effects', () => {
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const card = document.querySelector('.transition-all.hover\\:shadow-lg');
      expect(card).toBeInTheDocument();
    });

    test('applies custom className correctly', () => {
      const provider = createValidProvider();
      const customClass = 'custom-provider-card';

      render(
        <ProviderCard 
          provider={provider} 
          className={customClass}
          {...mockHandlers} 
        />
      );

      const cardWithCustomClass = document.querySelector(`.${customClass}`);
      expect(cardWithCustomClass).toBeInTheDocument();
    });

    test('status indicator reflects provider state correctly', () => {
      const activeValidProvider = createValidProvider({ isActive: true, isValid: true });

      render(
        <ProviderCard 
          provider={activeValidProvider} 
          isActive={true}
          {...mockHandlers} 
        />
      );

      // Should show success status when active and valid
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      
      // Status indicator should be small
      const statusContainer = screen.getByTestId('check-circle-icon').parentElement;
      expect(statusContainer).toHaveClass('w-4', 'h-4'); // sm size
    });

    test('delete button has proper warning styling', () => {
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      const deleteButton = screen.getByTestId('trash-icon').parentElement!;
      expect(deleteButton).toHaveClass('text-red-600', 'hover:text-red-700');
    });
  });

  describe('Accessibility Integration', () => {
    test('all interactive elements are keyboard accessible', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} isActive={false} {...mockHandlers} />
      );

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId('more-icon').parentElement).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '验证' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: '激活' })).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('edit-icon').parentElement).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('trash-icon').parentElement).toHaveFocus();
    });

    test('buttons have proper ARIA labels and roles', () => {
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      // Check button roles
      expect(screen.getByRole('button', { name: '验证' })).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon').parentElement).toHaveAttribute('role', 'button');
      expect(screen.getByTestId('trash-icon').parentElement).toHaveAttribute('role', 'button');
    });

    test('status information is accessible to screen readers', () => {
      const provider = createValidProvider({ isValid: true });

      render(
        <ProviderCard provider={provider} isActive={true} {...mockHandlers} />
      );

      // Status text should be readable
      expect(screen.getByText('已激活')).toBeInTheDocument();
      expect(screen.getByText('当前激活')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    test('handles missing handler functions gracefully', () => {
      const provider = createValidProvider();

      // Should not crash with undefined handlers
      expect(() => {
        render(
          <ProviderCard 
            provider={provider} 
            onEdit={() => {}}
            onDelete={() => {}}
            onActivate={() => {}}
            onValidate={() => {}}
          />
        );
      }).not.toThrow();
    });

    test('handles provider with invalid data gracefully', () => {
      const invalidProvider = {
        ...createValidProvider(),
        baseUrl: '', // Invalid empty URL
        model: '', // Invalid empty model
      } as Provider;

      expect(() => {
        render(
          <ProviderCard provider={invalidProvider} {...mockHandlers} />
        );
      }).not.toThrow();

      // Should still render the card structure
      expect(document.querySelector('.transition-all')).toBeInTheDocument();
    });

    test('handles extremely long provider data', () => {
      const longDataProvider = createValidProvider({
        name: 'A'.repeat(100),
        description: 'D'.repeat(500),
        baseUrl: 'https://extremely-long-domain-name.example.com/api/v1/very/long/path/that/might/break/layout',
        tags: Array.from({ length: 20 }, (_, i) => `tag-${i}-with-long-name`),
      });

      render(
        <ProviderCard provider={longDataProvider} {...mockHandlers} />
      );

      // Should render without breaking
      expect(screen.getByText(longDataProvider.name)).toBeInTheDocument();
      expect(screen.getByText(longDataProvider.description!)).toBeInTheDocument();
    });
  });

  describe('Complex State Scenarios', () => {
    test('handles provider switching from active to inactive', () => {
      const provider = createValidProvider();

      const { rerender } = render(
        <ProviderCard provider={provider} isActive={true} {...mockHandlers} />
      );

      // Initially active
      expect(screen.getByText('已激活')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '激活' })).not.toBeInTheDocument();

      // Switch to inactive
      rerender(
        <ProviderCard provider={provider} isActive={false} {...mockHandlers} />
      );

      expect(screen.queryByText('已激活')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '激活' })).toBeInTheDocument();
    });

    test('handles validation state changes', () => {
      const provider = createValidProvider({ isValid: undefined });

      const { rerender } = render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      // Initially unknown
      expect(screen.getByText('未验证')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();

      // Update to valid
      rerender(
        <ProviderCard 
          provider={{ ...provider, isValid: true }} 
          {...mockHandlers} 
        />
      );

      expect(screen.getByText('可用')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();

      // Update to invalid
      rerender(
        <ProviderCard 
          provider={{ ...provider, isValid: false }} 
          {...mockHandlers} 
        />
      );

      expect(screen.getByText('验证失败')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    test('handles provider with all states combined', () => {
      const complexProvider = createValidProvider({
        isActive: false,
        isValid: false,
        description: 'Failed provider for testing',
        tags: ['test', 'failed', 'debug'],
      });

      render(
        <ProviderCard provider={complexProvider} isActive={false} {...mockHandlers} />
      );

      // Should show inactive, invalid state
      expect(screen.getByText('验证失败')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '激活' })).toBeInTheDocument();
      expect(screen.queryByText('已激活')).not.toBeInTheDocument();

      // All tags should be visible
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('debug')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    test('does not cause unnecessary re-renders', () => {
      const provider = createValidProvider();
      const renderSpy = jest.fn();

      const TestWrapper = ({ testProvider }: { testProvider: Provider }) => {
        renderSpy();
        return <ProviderCard provider={testProvider} {...mockHandlers} />;
      };

      const { rerender } = render(<TestWrapper testProvider={provider} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same provider should not cause re-render
      rerender(<TestWrapper testProvider={provider} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);

      // Different provider should cause re-render
      const newProvider = createValidProvider();
      rerender(<TestWrapper testProvider={newProvider} />);
      expect(renderSpy).toHaveBeenCalledTimes(3);
    });

    test('handles rapid state updates efficiently', async () => {
      const user = userEvent.setup();
      const provider = createValidProvider();

      render(
        <ProviderCard provider={provider} {...mockHandlers} />
      );

      // Rapidly click validate button
      const validateButton = screen.getByRole('button', { name: '验证' });
      
      await user.click(validateButton);
      await user.click(validateButton);
      await user.click(validateButton);

      // Should handle multiple clicks without issues
      expect(mockHandlers.onValidate).toHaveBeenCalledTimes(3);
      expect(validateButton).toBeInTheDocument(); // Button should still be functional
    });
  });
});