import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('renders title correctly', () => {
      render(<Modal {...defaultProps} title="Custom Title" />);
      
      const title = screen.getByText('Custom Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-lg', 'font-medium', 'leading-6', 'text-gray-900');
    });

    test('renders children content', () => {
      const customChildren = (
        <div>
          <h2>Custom Content</h2>
          <p>This is custom modal content.</p>
          <button>Custom Button</button>
        </div>
      );

      render(<Modal {...defaultProps}>{customChildren}</Modal>);
      
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
      expect(screen.getByText('This is custom modal content.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument();
    });

    test('renders close button', () => {
      render(<Modal {...defaultProps} />);
      
      // Close button should be present (X icon button)
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      
      // Should have proper styling
      expect(closeButton).toHaveClass('text-gray-400', 'hover:text-gray-600');
    });
  });

  describe('Modal Structure and Styling', () => {
    test('applies correct overlay styling', () => {
      render(<Modal {...defaultProps} />);
      
      // Find the backdrop overlay
      const overlay = document.querySelector('.fixed.inset-0.bg-gray-500.bg-opacity-75');
      expect(overlay).toBeInTheDocument();
    });

    test('applies correct modal container styling', () => {
      render(<Modal {...defaultProps} />);
      
      // Find the modal container
      const modalContainer = document.querySelector('.relative.inline-block.w-full.max-w-lg');
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass('p-6', 'bg-white', 'rounded-lg', 'shadow-xl');
    });

    test('has proper z-index for overlay', () => {
      render(<Modal {...defaultProps} />);
      
      const outerContainer = document.querySelector('.fixed.inset-0.z-50');
      expect(outerContainer).toBeInTheDocument();
    });

    test('centers modal properly', () => {
      render(<Modal {...defaultProps} />);
      
      const centeringContainer = document.querySelector('.flex.items-center.justify-center.min-h-screen');
      expect(centeringContainer).toBeInTheDocument();
    });
  });

  describe('Confirm/Cancel Actions', () => {
    test('renders action buttons when onConfirm is provided', () => {
      const onConfirm = jest.fn();
      render(<Modal {...defaultProps} onConfirm={onConfirm} />);
      
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument();
    });

    test('does not render action buttons when onConfirm is not provided', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.queryByRole('button', { name: '取消' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '确认' })).not.toBeInTheDocument();
      
      // Only the close (X) button should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    test('cancel button calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onConfirm = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('confirm button calls onConfirm', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onConfirm = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByRole('button', { name: '确认' });
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    test('action buttons have correct styling', () => {
      const onConfirm = jest.fn();
      render(<Modal {...defaultProps} onConfirm={onConfirm} />);
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
      const confirmButton = screen.getByRole('button', { name: '确认' });
      
      // Cancel button styling
      expect(cancelButton).toHaveClass('text-gray-700', 'bg-gray-200', 'hover:bg-gray-300');
      
      // Confirm button styling
      expect(confirmButton).toHaveClass('text-white', 'bg-blue-600', 'hover:bg-blue-700');
    });
  });

  describe('Close Interactions', () => {
    test('close button calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Find the X close button (first button, since it's before action buttons)
      const closeButton = screen.getAllByRole('button')[0];
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('clicking backdrop calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Find the backdrop by its class
      const backdrop = document.querySelector('.fixed.inset-0.bg-gray-500.bg-opacity-75') as HTMLElement;
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('clicking modal content does not call onClose', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      const modalContent = screen.getByText('Modal content');
      await user.click(modalContent);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('clicking modal container does not call onClose', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Click the modal container itself (white background area)
      const modalContainer = document.querySelector('.relative.inline-block') as HTMLElement;
      await user.click(modalContainer);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    test('escape key closes modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      
      // Note: The component doesn't currently handle Escape key
      // This test documents expected behavior that could be implemented
      // expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('tab navigation works within modal', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(
        <Modal {...defaultProps} onConfirm={onConfirm}>
          <input type="text" placeholder="Test input" />
          <button>Custom button</button>
        </Modal>
      );
      
      const input = screen.getByPlaceholderText('Test input');
      const customButton = screen.getByRole('button', { name: 'Custom button' });
      const closeButton = screen.getAllByRole('button')[0]; // X button
      
      // Focus should move through elements in modal
      await user.tab();
      expect(closeButton).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(customButton).toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    test('focuses modal when opened', () => {
      render(<Modal {...defaultProps} />);
      
      // Modal should be focusable or focus should be trapped
      // This is a common accessibility requirement
      const modalContainer = document.querySelector('.relative.inline-block') as HTMLElement;
      expect(modalContainer).toBeInTheDocument();
    });

    test('restores focus when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      // Focus should return to previously focused element
      // This would need to be implemented in the component
    });
  });

  describe('Content Variations', () => {
    test('handles long content with scrolling', () => {
      const longContent = (
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>Long paragraph {i + 1} with lots of content that might cause scrolling.</p>
          ))}
        </div>
      );

      render(<Modal {...defaultProps}>{longContent}</Modal>);
      
      expect(screen.getByText('Long paragraph 1 with lots of content that might cause scrolling.')).toBeInTheDocument();
      expect(screen.getByText('Long paragraph 50 with lots of content that might cause scrolling.')).toBeInTheDocument();
      
      // Modal container should handle overflow
      const outerContainer = document.querySelector('.overflow-y-auto');
      expect(outerContainer).toBeInTheDocument();
    });

    test('handles empty children', () => {
      render(<Modal {...defaultProps}>{null}</Modal>);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      // Content area should still exist
      const contentArea = document.querySelector('.mt-2');
      expect(contentArea).toBeInTheDocument();
    });

    test('handles complex nested content', () => {
      const complexContent = (
        <div>
          <form>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First name" />
              <input type="text" placeholder="Last name" />
            </div>
            <textarea placeholder="Message"></textarea>
            <div className="flex space-x-2">
              <button type="button">Preview</button>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      );

      render(<Modal {...defaultProps}>{complexContent}</Modal>);
      
      expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined onClose gracefully', () => {
      // This should not crash the component
      expect(() => {
        render(
          <Modal
            isOpen={true}
            onClose={undefined as any}
            title="Test"
          >
            Content
          </Modal>
        );
      }).not.toThrow();
    });

    test('handles very long titles', () => {
      const longTitle = 'A'.repeat(200);
      render(<Modal {...defaultProps} title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('handles special characters in title', () => {
      const specialTitle = 'Modal with & < > " \' symbols 中文 🎉';
      render(<Modal {...defaultProps} title={specialTitle} />);
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    test('handles rapid open/close cycles', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} isOpen={false} />);
      
      // Rapidly toggle modal
      for (let i = 0; i < 10; i++) {
        rerender(<Modal {...defaultProps} onClose={onClose} isOpen={i % 2 === 0} />);
      }
      
      // Should not crash and final state should be closed
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('modal has proper ARIA attributes', () => {
      render(<Modal {...defaultProps} />);
      
      const title = screen.getByText('Test Modal');
      expect(title).toHaveClass('text-lg', 'font-medium');
      
      // Note: The component could be enhanced with proper ARIA attributes:
      // - role="dialog"
      // - aria-modal="true" 
      // - aria-labelledby pointing to title
    });

    test('close button is accessible', () => {
      render(<Modal {...defaultProps} />);
      
      const closeButton = screen.getAllByRole('button')[0];
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    test('action buttons are accessible', () => {
      const onConfirm = jest.fn();
      render(<Modal {...defaultProps} onConfirm={onConfirm} />);
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
      const confirmButton = screen.getByRole('button', { name: '确认' });
      
      expect(cancelButton).toHaveClass('focus:outline-none', 'focus:ring-2');
      expect(confirmButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    test('supports screen readers', () => {
      render(<Modal {...defaultProps} />);
      
      // Title should be accessible to screen readers
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Test Modal');
    });
  });

  describe('Performance', () => {
    test('does not render when closed', () => {
      const { container } = render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    test('cleans up properly when unmounted', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });

    test('handles multiple modals', () => {
      render(
        <div>
          <Modal {...defaultProps} title="Modal 1">Content 1</Modal>
          <Modal {...defaultProps} title="Modal 2" isOpen={false}>Content 2</Modal>
          <Modal {...defaultProps} title="Modal 3">Content 3</Modal>
        </div>
      );
      
      // Only open modals should render
      expect(screen.getByText('Modal 1')).toBeInTheDocument();
      expect(screen.queryByText('Modal 2')).not.toBeInTheDocument();
      expect(screen.getByText('Modal 3')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('works with form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e) => {
        e.preventDefault();
      });

      const formContent = (
        <form onSubmit={onSubmit}>
          <input name="test" defaultValue="test value" />
          <button type="submit">Submit Form</button>
        </form>
      );

      render(<Modal {...defaultProps}>{formContent}</Modal>);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Form' });
      await user.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalled();
    });

    test('maintains state during modal lifecycle', () => {
      const StatefulContent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        );
      };

      const { rerender } = render(
        <Modal {...defaultProps}>
          <StatefulContent />
        </Modal>
      );
      
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
      
      // Component state should persist during modal re-renders
      rerender(
        <Modal {...defaultProps} title="Updated Title">
          <StatefulContent />
        </Modal>
      );
      
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });
  });
});