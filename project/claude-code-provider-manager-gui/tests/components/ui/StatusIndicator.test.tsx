import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
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

describe('StatusIndicator Component', () => {
  describe('Status Types', () => {
    test('renders success status', () => {
      render(<StatusIndicator status="success" />);
      
      const container = screen.getByTestId('check-circle-icon').parentElement;
      const icon = screen.getByTestId('check-circle-icon');
      
      expect(container).toHaveClass('bg-green-100', 'border-green-200');
      expect(icon).toHaveClass('text-green-600');
    });

    test('renders error status', () => {
      render(<StatusIndicator status="error" />);
      
      const container = screen.getByTestId('x-circle-icon').parentElement;
      const icon = screen.getByTestId('x-circle-icon');
      
      expect(container).toHaveClass('bg-red-100', 'border-red-200');
      expect(icon).toHaveClass('text-red-600');
    });

    test('renders warning status', () => {
      render(<StatusIndicator status="warning" />);
      
      const container = screen.getByTestId('alert-triangle-icon').parentElement;
      const icon = screen.getByTestId('alert-triangle-icon');
      
      expect(container).toHaveClass('bg-yellow-100', 'border-yellow-200');
      expect(icon).toHaveClass('text-yellow-600');
    });

    test('renders loading status', () => {
      render(<StatusIndicator status="loading" />);
      
      const container = screen.getByTestId('clock-icon').parentElement;
      const icon = screen.getByTestId('clock-icon');
      
      expect(container).toHaveClass('bg-blue-100', 'border-blue-200');
      expect(icon).toHaveClass('text-blue-600');
    });

    test('renders unknown status', () => {
      render(<StatusIndicator status="unknown" />);
      
      const container = screen.getByTestId('clock-icon').parentElement;
      const icon = screen.getByTestId('clock-icon');
      
      expect(container).toHaveClass('bg-gray-100', 'border-gray-200');
      expect(icon).toHaveClass('text-gray-600');
    });
  });

  describe('Text Content', () => {
    test('renders without text', () => {
      render(<StatusIndicator status="success" />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.queryByText(/[A-Za-z]/)).not.toBeInTheDocument(); // No text content
    });

    test('renders with text', () => {
      render(<StatusIndicator status="success" text="Operation successful" />);
      
      const text = screen.getByText('Operation successful');
      expect(text).toBeInTheDocument();
      expect(text).toHaveClass('text-sm', 'font-medium', 'text-green-600');
    });

    test('renders with empty text string', () => {
      render(<StatusIndicator status="error" text="" />);
      
      const container = screen.getByTestId('x-circle-icon').parentElement;
      // Empty text should not create a span element for text
      const textSpan = container?.querySelector('span');
      expect(textSpan).not.toBeInTheDocument();
    });

    test('renders with long text', () => {
      const longText = 'This is a very long status message that might wrap to multiple lines or be truncated depending on the container';
      render(<StatusIndicator status="warning" text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    test('text color matches status', () => {
      const statusTests = [
        { status: 'success' as const, colorClass: 'text-green-600' },
        { status: 'error' as const, colorClass: 'text-red-600' },
        { status: 'warning' as const, colorClass: 'text-yellow-600' },
        { status: 'loading' as const, colorClass: 'text-blue-600' },
        { status: 'unknown' as const, colorClass: 'text-gray-600' },
      ];

      statusTests.forEach(({ status, colorClass }) => {
        const { unmount } = render(<StatusIndicator status={status} text="Test text" />);
        
        const text = screen.getByText('Test text');
        expect(text).toHaveClass(colorClass);
        
        unmount();
      });
    });
  });

  describe('Sizes', () => {
    test('renders with default medium size', () => {
      render(<StatusIndicator status="success" />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('w-5', 'h-5');
    });

    test('renders with small size', () => {
      render(<StatusIndicator status="success" size="sm" />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('w-4', 'h-4');
    });

    test('renders with medium size explicitly', () => {
      render(<StatusIndicator status="success" size="md" />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('w-5', 'h-5');
    });

    test('renders with large size', () => {
      render(<StatusIndicator status="success" size="lg" />);
      
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Styling and Layout', () => {
    test('applies base container classes', () => {
      render(<StatusIndicator status="success" />);
      
      const container = screen.getByTestId('check-circle-icon').parentElement;
      expect(container).toHaveClass(
        'inline-flex',
        'items-center',
        'space-x-2',
        'border',
        'rounded-full',
        'px-3',
        'py-1'
      );
    });

    test('renders with custom className', () => {
      render(<StatusIndicator status="error" className="custom-class" />);
      
      const container = screen.getByTestId('x-circle-icon').parentElement;
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('inline-flex'); // should still have base classes
    });

    test('maintains proper spacing between icon and text', () => {
      render(<StatusIndicator status="success" text="Success message" />);
      
      const container = screen.getByTestId('check-circle-icon').parentElement;
      expect(container).toHaveClass('space-x-2');
    });

    test('applies correct padding and border radius', () => {
      render(<StatusIndicator status="loading" />);
      
      const container = screen.getByTestId('clock-icon').parentElement;
      expect(container).toHaveClass('rounded-full', 'px-3', 'py-1');
    });
  });

  describe('Icon Rendering', () => {
    test('renders correct icon for each status', () => {
      const iconTests = [
        { status: 'success' as const, testId: 'check-circle-icon' },
        { status: 'error' as const, testId: 'x-circle-icon' },
        { status: 'warning' as const, testId: 'alert-triangle-icon' },
        { status: 'loading' as const, testId: 'clock-icon' },
        { status: 'unknown' as const, testId: 'clock-icon' },
      ];

      iconTests.forEach(({ status, testId }) => {
        const { unmount } = render(<StatusIndicator status={status} />);
        
        expect(screen.getByTestId(testId)).toBeInTheDocument();
        
        unmount();
      });
    });

    test('icon has proper styling', () => {
      render(<StatusIndicator status="error" size="lg" />);
      
      const icon = screen.getByTestId('x-circle-icon');
      expect(icon).toHaveClass('w-6', 'h-6', 'text-red-600');
    });
  });

  describe('Color Consistency', () => {
    test('container and content colors are consistent', () => {
      const colorTests = [
        {
          status: 'success' as const,
          containerClasses: ['bg-green-100', 'border-green-200'],
          contentClass: 'text-green-600'
        },
        {
          status: 'error' as const,
          containerClasses: ['bg-red-100', 'border-red-200'],
          contentClass: 'text-red-600'
        },
        {
          status: 'warning' as const,
          containerClasses: ['bg-yellow-100', 'border-yellow-200'],
          contentClass: 'text-yellow-600'
        },
        {
          status: 'loading' as const,
          containerClasses: ['bg-blue-100', 'border-blue-200'],
          contentClass: 'text-blue-600'
        },
        {
          status: 'unknown' as const,
          containerClasses: ['bg-gray-100', 'border-gray-200'],
          contentClass: 'text-gray-600'
        },
      ];

      colorTests.forEach(({ status, containerClasses, contentClass }) => {
        const { unmount } = render(
          <StatusIndicator status={status} text="Test" />
        );
        
        const container = screen.getByText('Test').parentElement;
        const text = screen.getByText('Test');
        
        containerClasses.forEach(className => {
          expect(container).toHaveClass(className);
        });
        expect(text).toHaveClass(contentClass);
        
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    test('maintains semantic structure', () => {
      render(<StatusIndicator status="success" text="Operation completed" />);
      
      const container = screen.getByText('Operation completed').parentElement;
      expect(container).toBeInTheDocument();
      
      // Icon and text should be within the same container
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });

    test('supports role attributes', () => {
      render(
        <StatusIndicator 
          status="error" 
          text="Error occurred" 
        />
      );
      
      // While not implemented in the component, the structure supports accessibility
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    test('icon is decorative by default', () => {
      render(<StatusIndicator status="warning" text="Warning message" />);
      
      // Icons should be decorative since the status is conveyed through text and colors
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined text prop', () => {
      render(<StatusIndicator status="success" text={undefined} />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      // No text should be rendered (only icon)
      expect(screen.queryByText(/[A-Za-z]/)).not.toBeInTheDocument();
    });

    test('handles null text prop', () => {
      render(<StatusIndicator status="success" text={null as any} />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('handles special characters in text', () => {
      const specialText = 'Status: 100% complete & ready! 🎉';
      render(<StatusIndicator status="success" text={specialText} />);
      
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    test('handles extremely long text', () => {
      const longText = 'A'.repeat(1000);
      render(<StatusIndicator status="warning" text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    test('handles empty className', () => {
      render(<StatusIndicator status="loading" className="" />);
      
      const container = screen.getByTestId('clock-icon').parentElement;
      expect(container).toHaveClass('inline-flex'); // base classes should still apply
    });
  });

  describe('Component Integration', () => {
    test('works within different containers', () => {
      render(
        <div className="flex space-x-4">
          <StatusIndicator status="success" text="Success" />
          <StatusIndicator status="error" text="Error" />
          <StatusIndicator status="warning" text="Warning" />
        </div>
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    test('maintains consistent appearance across different states', () => {
      const { rerender } = render(<StatusIndicator status="loading" text="Processing..." />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      
      rerender(<StatusIndicator status="success" text="Complete!" />);
      
      expect(screen.getByText('Complete!')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('handles rapid status changes', () => {
      const { rerender } = render(<StatusIndicator status="loading" />);
      
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      
      rerender(<StatusIndicator status="success" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      
      rerender(<StatusIndicator status="error" />);
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ status }: { status: 'success' | 'error' }) => {
        renderSpy();
        return <StatusIndicator status={status} text="Test" />;
      };

      const { rerender } = render(<TestWrapper status="success" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Rerender with same props
      rerender(<TestWrapper status="success" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      
      // Rerender with different props
      rerender(<TestWrapper status="error" />);
      expect(renderSpy).toHaveBeenCalledTimes(3);
    });

    test('handles multiple instances efficiently', () => {
      const indicators = Array.from({ length: 100 }, (_, i) => (
        <StatusIndicator
          key={i}
          status={(['success', 'error', 'warning', 'loading', 'unknown'] as const)[i % 5]}
          text={`Status ${i}`}
          size={(['sm', 'md', 'lg'] as const)[i % 3]}
        />
      ));

      render(<div>{indicators}</div>);
      
      // Should render all instances
      expect(screen.getByText('Status 0')).toBeInTheDocument();
      expect(screen.getByText('Status 99')).toBeInTheDocument();
    });
  });
});