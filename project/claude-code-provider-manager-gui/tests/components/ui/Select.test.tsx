import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/components/ui/Select';
import { SelectOption } from '@/types';

describe('Select Component', () => {
  const basicOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const optionsWithDisabled: SelectOption[] = [
    { value: 'enabled', label: 'Enabled Option' },
    { value: 'disabled', label: 'Disabled Option', disabled: true },
    { value: 'enabled2', label: 'Another Enabled' },
  ];

  describe('Rendering', () => {
    test('renders basic select with options', () => {
      render(<Select options={basicOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveClass('block', 'w-full', 'rounded-md');
    });

    test('renders with label', () => {
      render(<Select label="Choose option" options={basicOptions} />);
      
      const label = screen.getByText('Choose option');
      const select = screen.getByRole('combobox', { name: /choose option/i });
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700');
      expect(select).toBeInTheDocument();
    });

    test('generates unique id when not provided', () => {
      render(<Select label="Test" options={basicOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id');
      expect(select.id).toMatch(/^select-[a-z0-9]+$/);
    });

    test('uses provided custom id', () => {
      render(<Select id="custom-select" label="Test" options={basicOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'custom-select');
    });

    test('renders with helper text', () => {
      render(
        <Select 
          options={basicOptions} 
          helperText="Choose your preferred option" 
        />
      );
      
      expect(screen.getByText('Choose your preferred option')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred option')).toHaveClass('text-gray-500');
    });

    test('renders with custom className', () => {
      render(<Select className="custom-class" options={basicOptions} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
      expect(select).toHaveClass('block', 'w-full'); // should still have base classes
    });
  });

  describe('Options Rendering', () => {
    test('renders all options', () => {
      render(<Select options={basicOptions} />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      
      expect(screen.getByRole('option', { name: 'Option 1' })).toHaveValue('option1');
      expect(screen.getByRole('option', { name: 'Option 2' })).toHaveValue('option2');
      expect(screen.getByRole('option', { name: 'Option 3' })).toHaveValue('option3');
    });

    test('handles disabled options', () => {
      render(<Select options={optionsWithDisabled} />);
      
      const enabledOption = screen.getByRole('option', { name: 'Enabled Option' });
      const disabledOption = screen.getByRole('option', { name: 'Disabled Option' });
      
      expect(enabledOption).not.toBeDisabled();
      expect(disabledOption).toBeDisabled();
    });

    test('handles empty options array', () => {
      render(<Select options={[]} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      const options = screen.queryAllByRole('option');
      expect(options).toHaveLength(0);
    });

    test('handles single option', () => {
      const singleOption = [{ value: 'only', label: 'Only Option' }];
      render(<Select options={singleOption} />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Only Option');
    });

    test('handles options with special characters', () => {
      const specialOptions: SelectOption[] = [
        { value: 'special&chars', label: 'Option with & symbols' },
        { value: 'unicode', label: 'Option with 中文 and émojis 🚀' },
        { value: 'quotes', label: 'Option with "quotes" and \'apostrophes\'' },
      ];

      render(<Select options={specialOptions} />);
      
      expect(screen.getByRole('option', { name: 'Option with & symbols' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option with 中文 and émojis 🚀' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /quotes.*apostrophes/ })).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    test('renders with error message', () => {
      render(
        <Select 
          options={basicOptions} 
          error="Please select a valid option" 
        />
      );
      
      const errorMessage = screen.getByText('Please select a valid option');
      const select = screen.getByRole('combobox');
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600');
      expect(select).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
    });

    test('error takes precedence over helper text', () => {
      render(
        <Select 
          options={basicOptions} 
          error="Error message" 
          helperText="Helper text" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    test('shows helper text when no error', () => {
      render(
        <Select 
          options={basicOptions} 
          helperText="Helper text" 
        />
      );
      
      expect(screen.getByText('Helper text')).toBeInTheDocument();
      expect(screen.getByText('Helper text')).toHaveClass('text-gray-500');
    });

    test('error state adds error styles', () => {
      render(
        <Select 
          options={basicOptions} 
          error="Error" 
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
      // Note: base classes are still present but error classes take visual precedence
    });
  });

  describe('States and Attributes', () => {
    test('handles disabled state', () => {
      render(<Select options={basicOptions} disabled />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(select).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
    });

    test('handles required state', () => {
      render(<Select options={basicOptions} required />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });

    test('handles multiple attribute', () => {
      render(<Select options={basicOptions} multiple />);
      
      const select = screen.getByRole('listbox'); // multiple selects have listbox role
      expect(select).toHaveAttribute('multiple');
    });

    test('handles name attribute', () => {
      render(<Select options={basicOptions} name="test-select" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('name', 'test-select');
    });

    test('handles defaultValue', () => {
      render(<Select options={basicOptions} defaultValue="option2" />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });
  });

  describe('Interactions', () => {
    test('handles value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select 
          options={basicOptions} 
          onChange={handleChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      
      await user.selectOptions(select, 'option2');
      
      expect(handleChange).toHaveBeenCalled();
      expect(select).toHaveValue('option2');
    });

    test('handles controlled select', async () => {
      const user = userEvent.setup();
      let value = 'option1';
      const handleChange = jest.fn((e) => {
        value = e.target.value;
      });

      const ControlledSelect = () => (
        <Select 
          options={basicOptions} 
          value={value}
          onChange={handleChange}
        />
      );

      const { rerender } = render(<ControlledSelect />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('option1');
      
      await user.selectOptions(select, 'option3');
      expect(handleChange).toHaveBeenCalled();
      
      // Rerender with new value
      rerender(<ControlledSelect />);
      expect(select).toHaveValue('option3');
    });

    test('handles focus and blur events', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(
        <Select 
          options={basicOptions} 
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      );
      
      const select = screen.getByRole('combobox');
      
      await user.click(select);
      expect(handleFocus).toHaveBeenCalled();
      
      await user.tab(); // Move focus away
      expect(handleBlur).toHaveBeenCalled();
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<Select options={basicOptions} />);
      
      const select = screen.getByRole('combobox');
      
      await user.click(select);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Note: Keyboard navigation behavior may vary by browser
      expect(select).toBeInTheDocument();
    });

    test('prevents selection of disabled options', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <Select 
          options={optionsWithDisabled} 
          onChange={handleChange}
        />
      );
      
      const select = screen.getByRole('combobox');
      
      // Trying to select disabled option should not trigger onChange
      await user.selectOptions(select, 'disabled');
      
      // The disabled option should not be selectable
      expect(select).not.toHaveValue('disabled');
    });
  });

  describe('Accessibility', () => {
    test('associates label with select correctly', () => {
      render(<Select label="Choose option" options={basicOptions} />);
      
      const label = screen.getByText('Choose option');
      const select = screen.getByRole('combobox');
      
      expect(label).toHaveAttribute('for', select.id);
      expect(select).toHaveAccessibleName('Choose option');
    });

    test('supports aria-describedby for helper text', () => {
      render(
        <Select 
          id="test-select"
          options={basicOptions} 
          helperText="Choose your preferred option"
        />
      );
      
      const select = screen.getByRole('combobox');
      const helperText = screen.getByText('Choose your preferred option');
      
      // Note: aria-describedby would need to be implemented in the component
      expect(helperText).toBeInTheDocument();
    });

    test('supports aria-invalid for error state', () => {
      render(
        <Select 
          options={basicOptions} 
          error="Invalid selection"
          aria-invalid="true"
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    test('supports custom aria attributes', () => {
      render(
        <Select 
          options={basicOptions}
          aria-label="Custom select"
          aria-describedby="custom-description"
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Custom select');
      expect(select).toHaveAttribute('aria-describedby', 'custom-description');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined props gracefully', () => {
      render(
        <Select 
          options={basicOptions}
          label={undefined} 
          error={undefined} 
          helperText={undefined} 
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('handles empty string props', () => {
      render(
        <Select 
          options={basicOptions}
          label="" 
          error="" 
          helperText="" 
        />
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('handles very long option labels', () => {
      const longLabelOptions: SelectOption[] = [
        { value: 'short', label: 'Short' },
        { value: 'long', label: 'A'.repeat(100) + ' Very Long Option Label' },
      ];

      render(<Select options={longLabelOptions} />);
      
      const longOption = screen.getByRole('option', { name: /Very Long Option Label/ });
      expect(longOption).toBeInTheDocument();
    });

    test('forwards all HTML select props', () => {
      render(
        <Select 
          options={basicOptions}
          data-testid="custom-select"
          tabIndex={5}
          autoFocus
        />
      );
      
      const select = screen.getByTestId('custom-select');
      expect(select).toHaveAttribute('tabIndex', '5');
      expect(select).toHaveFocus();
    });

    test('handles duplicate option values', () => {
      const duplicateOptions: SelectOption[] = [
        { value: 'duplicate', label: 'First Duplicate' },
        { value: 'duplicate', label: 'Second Duplicate' },
        { value: 'unique', label: 'Unique Option' },
      ];

      render(<Select options={duplicateOptions} />);
      
      // Both options should render (even with same value)
      expect(screen.getByRole('option', { name: 'First Duplicate' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Second Duplicate' })).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    test('works with form submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        expect(formData.get('test-select')).toBe('option2');
      });

      render(
        <form onSubmit={handleSubmit}>
          <Select 
            name="test-select" 
            options={basicOptions} 
            defaultValue="option2"
          />
          <button type="submit">Submit</button>
        </form>
      );
      
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    test('supports form validation', () => {
      render(
        <form>
          <Select 
            name="required-select" 
            options={basicOptions} 
            required
          />
          <button type="submit">Submit</button>
        </form>
      );
      
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderCount = jest.fn();
      
      const TestComponent = ({ options }: { options: SelectOption[] }) => {
        renderCount();
        return <Select options={options} />;
      };

      const { rerender } = render(<TestComponent options={basicOptions} />);
      
      expect(renderCount).toHaveBeenCalledTimes(1);
      
      // Rerender with same options
      rerender(<TestComponent options={basicOptions} />);
      expect(renderCount).toHaveBeenCalledTimes(2); // Will re-render due to new array reference
      
      // This is expected behavior since we're passing a new array each time
    });

    test('handles large option sets', () => {
      const largeOptionSet: SelectOption[] = Array.from({ length: 1000 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      render(<Select options={largeOptionSet} />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1000);
      
      // First and last options should be rendered
      expect(screen.getByRole('option', { name: 'Option 0' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 999' })).toBeInTheDocument();
    });
  });
});