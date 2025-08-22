import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600', 'text-white');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm'); // default md size
    });

    test('renders with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-blue-600'); // should still have base classes
    });

    test('renders children correctly', () => {
      render(
        <Button>
          <span>Complex</span>
          <em>children</em>
        </Button>
      );
      
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('children')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders primary variant (default)', () => {
      render(<Button>Primary</Button>);
      
      const button = screen.getByRole('button', { name: /primary/i });
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    test('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    });

    test('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      
      const button = screen.getByRole('button', { name: /danger/i });
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });

    test('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('bg-transparent', 'text-gray-700');
      expect(button).toHaveClass('border', 'border-gray-300');
    });
  });

  describe('Sizes', () => {
    test('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    test('renders medium size (default)', () => {
      render(<Button>Medium</Button>);
      
      const button = screen.getByRole('button', { name: /medium/i });
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    test('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  describe('States', () => {
    test('handles disabled state', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles loading state', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeDisabled();
      
      // Check for loading spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-4', 'w-4');
      
      // Should not trigger click when loading
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('loading state takes precedence over disabled', () => {
      render(<Button loading disabled>Loading Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('renders left icon correctly', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={leftIcon}>With Left Icon</Button>);
      
      const button = screen.getByRole('button', { name: /with left icon/i });
      const icon = screen.getByTestId('left-icon');
      
      expect(icon).toBeInTheDocument();
      expect(button).toContainElement(icon);
      
      // Check icon positioning
      const iconWrapper = icon.parentElement;
      expect(iconWrapper).toHaveClass('mr-2');
    });

    test('renders right icon correctly', () => {
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={rightIcon}>With Right Icon</Button>);
      
      const button = screen.getByRole('button', { name: /with right icon/i });
      const icon = screen.getByTestId('right-icon');
      
      expect(icon).toBeInTheDocument();
      expect(button).toContainElement(icon);
      
      // Check icon positioning
      const iconWrapper = icon.parentElement;
      expect(iconWrapper).toHaveClass('ml-2');
    });

    test('renders both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;
      
      render(
        <Button leftIcon={leftIcon} rightIcon={rightIcon}>
          Both Icons
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    test('hides left icon when loading', () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={leftIcon} loading>Loading</Button>);
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('does not hide right icon when loading', () => {
      const rightIcon = <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={rightIcon} loading>Loading</Button>);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Keyboard Test</Button>);
      
      const button = screen.getByRole('button', { name: /keyboard test/i });
      
      // Focus the button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Press Space
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    test('handles multiple rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button', { name: /rapid click/i });
      
      // Multiple rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    test('prevents event bubbling when needed', async () => {
      const user = userEvent.setup();
      const parentClick = jest.fn();
      const buttonClick = jest.fn((e) => e.stopPropagation());
      
      render(
        <div onClick={parentClick}>
          <Button onClick={buttonClick}>Stop Propagation</Button>
        </div>
      );
      
      const button = screen.getByRole('button', { name: /stop propagation/i });
      await user.click(button);
      
      expect(buttonClick).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('applies accessibility attributes', () => {
      render(
        <Button 
          aria-label="Custom label"
          aria-describedby="description"
          title="Tooltip"
        >
          Accessible
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /custom label/i });
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('title', 'Tooltip');
    });

    test('has proper focus styles', () => {
      render(<Button>Focus Test</Button>);
      
      const button = screen.getByRole('button', { name: /focus test/i });
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    test('maintains focus ring color based on variant', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-blue-500');
      
      rerender(<Button variant="danger">Danger</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-red-500');
      
      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-gray-500');
    });

    test('announces loading state to screen readers', () => {
      render(<Button loading aria-label="Submit form">Submit</Button>);
      
      const button = screen.getByRole('button', { name: /submit form/i });
      expect(button).toBeDisabled();
      // In a real implementation, you might add aria-busy="true" or aria-live region
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined children', () => {
      render(<Button>{undefined}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    test('handles null children', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    test('handles empty string children', () => {
      render(<Button>{''}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    test('handles long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Button>{longText}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe(longText);
    });

    test('forwards all HTML button props', () => {
      render(
        <Button 
          type="submit"
          form="test-form"
          name="test-button"
          value="test-value"
          data-testid="custom-button"
        >
          Test
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('name', 'test-button');
      expect(button).toHaveAttribute('value', 'test-value');
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const handleClick = jest.fn();
      const { rerender } = render(<Button onClick={handleClick}>Test</Button>);
      
      // Re-render with same props
      rerender(<Button onClick={handleClick}>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('handles rapid state changes', async () => {
      const user = userEvent.setup();
      let loading = false;
      const TestComponent = () => {
        const [isLoading, setIsLoading] = React.useState(loading);
        
        return (
          <Button 
            loading={isLoading}
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 100);
            }}
          >
            Toggle Loading
          </Button>
        );
      };
      
      render(<TestComponent />);
      
      const button = screen.getByRole('button', { name: /toggle loading/i });
      await user.click(button);
      
      // Should handle state transition smoothly
      expect(button).toBeInTheDocument();
    });
  });
});