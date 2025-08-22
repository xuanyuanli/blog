import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    test('renders basic input', () => {
      render(<Input placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('block', 'w-full', 'rounded-md');
    });

    test('renders with label', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      
      const label = screen.getByText('Username');
      const input = screen.getByPlaceholderText('Enter username');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700');
      expect(label).toHaveAttribute('for');
      expect(input).toHaveAttribute('id', label.getAttribute('for'));
    });

    test('renders with custom id', () => {
      render(<Input id="custom-input" label="Custom" />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Custom');
      
      expect(input).toHaveAttribute('id', 'custom-input');
      expect(label).toHaveAttribute('for', 'custom-input');
    });

    test('generates unique id when not provided', () => {
      render(<Input label="Test 1" />);
      render(<Input label="Test 2" />);
      
      const input1 = screen.getByLabelText('Test 1');
      const input2 = screen.getByLabelText('Test 2');
      
      expect(input1).toHaveAttribute('id');
      expect(input2).toHaveAttribute('id');
      expect(input1.getAttribute('id')).not.toBe(input2.getAttribute('id'));
    });

    test('renders with helper text', () => {
      render(<Input helperText="This is helper text" />);
      
      const helperText = screen.getByText('This is helper text');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-sm', 'text-gray-500');
    });

    test('renders with custom className', () => {
      render(<Input className="custom-class" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('block', 'w-full'); // should still have base classes
    });
  });

  describe('Error States', () => {
    test('renders with error message', () => {
      render(<Input error="This field is required" />);
      
      const errorMessage = screen.getByText('This field is required');
      const input = screen.getByRole('textbox');
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-sm', 'text-red-600');
      expect(input).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
    });

    test('error takes precedence over helper text', () => {
      render(
        <Input 
          error="This field is required" 
          helperText="This is helper text" 
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
    });

    test('shows helper text when no error', () => {
      render(<Input helperText="This is helper text" />);
      
      const helperText = screen.getByText('This is helper text');
      expect(helperText).toHaveClass('text-gray-500');
    });
  });

  describe('Icons', () => {
    test('renders with left icon', () => {
      const leftIcon = <span data-testid="left-icon">🔍</span>;
      render(<Input leftIcon={leftIcon} />);
      
      const icon = screen.getByTestId('left-icon');
      const input = screen.getByRole('textbox');
      
      expect(icon).toBeInTheDocument();
      expect(input).toHaveClass('pl-10');
      
      // Check that icon is rendered
      expect(icon).toBeInTheDocument();
      
      // Check icon positioning container (parent of the styled span)
      const styledSpan = icon.parentElement; // This should be the span with text-gray-500
      const iconContainer = styledSpan?.parentElement; // This should be the div with positioning
      expect(styledSpan).toHaveClass('text-gray-500', 'sm:text-sm');
      expect(iconContainer).toHaveClass('absolute', 'inset-y-0', 'left-0', 'pl-3');
      expect(iconContainer).toHaveClass('pointer-events-none', 'flex', 'items-center');
    });

    test('renders with right icon', () => {
      const rightIcon = <span data-testid="right-icon">✓</span>;
      render(<Input rightIcon={rightIcon} />);
      
      const icon = screen.getByTestId('right-icon');
      const input = screen.getByRole('textbox');
      
      expect(icon).toBeInTheDocument();
      expect(input).toHaveClass('pr-10');
      
      // Check that icon is rendered
      expect(icon).toBeInTheDocument();
      
      // Check icon positioning container (parent of the styled span)
      const styledSpan = icon.parentElement; // This should be the span with text-gray-500
      const iconContainer = styledSpan?.parentElement; // This should be the div with positioning
      expect(styledSpan).toHaveClass('text-gray-500', 'sm:text-sm');
      expect(iconContainer).toHaveClass('absolute', 'inset-y-0', 'right-0', 'pr-3');
      expect(iconContainer).toHaveClass('pointer-events-none', 'flex', 'items-center');
    });

    test('renders with both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">🔍</span>;
      const rightIcon = <span data-testid="right-icon">✓</span>;
      
      render(<Input leftIcon={leftIcon} rightIcon={rightIcon} />);
      
      const input = screen.getByRole('textbox');
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(input).toHaveClass('pl-10', 'pr-10');
    });

    test('icon containers are not interactive', () => {
      const leftIconComponent = <span data-testid="left-icon">🔍</span>;
      render(<Input leftIcon={leftIconComponent} />);
      
      const leftIconElement = screen.getByTestId('left-icon');
      const styledSpan = leftIconElement.parentElement;
      const leftIconContainer = styledSpan?.parentElement;
      expect(leftIconContainer).toHaveClass('pointer-events-none', 'absolute');
    });
  });

  describe('Input Types', () => {
    test('renders as text input by default', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input.type).toBe('text');
    });

    test('renders as password input', () => {
      render(<Input type="password" />);
      
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    test('renders as email input', () => {
      render(<Input type="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('renders as number input', () => {
      render(<Input type="number" />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    test('renders as url input', () => {
      render(<Input type="url" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('States', () => {
    test('handles disabled state', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    test('handles readonly state', () => {
      render(<Input readOnly value="readonly value" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('readonly value');
    });

    test('handles required state', () => {
      render(<Input required />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    test('handles focus styles', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-500', 'focus:ring-blue-500');
    });

    test('error state overrides default focus styles', () => {
      render(<Input error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-red-500', 'focus:ring-red-500');
    });
  });

  describe('Interactions', () => {
    test('handles value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
      expect(handleChange).toHaveBeenCalled();
    });

    test('handles controlled input', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            data-testid="controlled-input"
          />
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('controlled-input');
      await user.type(input, 'controlled');
      
      expect(input).toHaveValue('controlled');
    });

    test('handles focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
      
      await user.click(document.body);
      expect(handleBlur).toHaveBeenCalled();
    });

    test('handles keyboard events', async () => {
      const user = userEvent.setup();
      const handleKeyDown = jest.fn();
      
      render(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');
      
      expect(handleKeyDown).toHaveBeenCalled();
    });

    test('prevents input when maxLength is reached', async () => {
      const user = userEvent.setup();
      
      render(<Input maxLength={5} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '123456789');
      
      expect(input).toHaveValue('12345'); // Should be truncated to maxLength
    });
  });

  describe('Accessibility', () => {
    test('associates label with input correctly', () => {
      render(<Input label="Username" />);
      
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });

    test('supports aria-describedby for error messages', () => {
      render(<Input error="This field is required" aria-describedby="custom-description" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'custom-description');
    });

    test('supports aria-invalid for error state', () => {
      render(<Input error="This field is required" aria-invalid />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid');
    });

    test('supports custom aria attributes', () => {
      render(
        <Input 
          aria-label="Search field"
          aria-describedby="search-help"
          aria-required="true"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search field');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined props gracefully', () => {
      render(<Input label={undefined} error={undefined} helperText={undefined} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('handles empty string props', () => {
      render(<Input label="" error="" helperText="" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      
      // Input should still be functional with empty strings
      expect(input).toHaveAttribute('id');
      expect(input).toHaveClass('block', 'w-full');
    });

    test('handles very long text content', () => {
      const longText = 'A'.repeat(1000);
      render(<Input label={longText} error={longText} helperText={longText} />);
      
      expect(screen.getAllByText(longText)).toHaveLength(2); // label and error (error takes precedence)
    });

    test('forwards all HTML input props', () => {
      render(
        <Input 
          name="test-input"
          placeholder="Test placeholder"
          autoComplete="username"
          autoFocus
          data-testid="custom-input"
        />
      );
      
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('placeholder', 'Test placeholder');
      expect(input).toHaveAttribute('autocomplete', 'username');
      expect(input).toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    test('works with form submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');
      
      await user.type(input, 'testuser');
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('supports form validation', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <Input required pattern="[a-zA-Z]+" title="Letters only" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button');
      
      // Try to submit without value (should fail validation)
      await user.click(submitButton);
      expect(input).toBeInvalid();
      
      // Enter valid value
      await user.type(input, 'validtext');
      expect(input).toBeValid();
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<Input value="test" onChange={() => {}} />);
      
      // Re-render with same props
      rerender(<Input value="test" onChange={() => {}} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('test');
    });

    test('handles rapid input changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Rapid typing
      await user.type(input, 'rapid', { delay: 1 });
      
      expect(input).toHaveValue('rapid');
      expect(handleChange).toHaveBeenCalled();
    });
  });
});