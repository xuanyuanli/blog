import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  test('renders with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  test('renders with different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    
    let button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    
    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button', { name: /danger/i });
    expect(button).toHaveClass('bg-red-600', 'text-white');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toHaveClass('bg-transparent', 'text-gray-700');
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('can be disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-75');
    
    // Check for loading spinner
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button).toHaveClass('custom-class');
  });

  test('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Ref Test</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  test('renders icon with button', () => {
    render(<Button icon={<span data-testid="icon">🔍</span>}>With Icon</Button>);
    
    const button = screen.getByRole('button', { name: /with icon/i });
    const icon = screen.getByTestId('icon');
    
    expect(icon).toBeInTheDocument();
    expect(button).toContainElement(icon);
  });

  test('handles keyboard events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard Test</Button>);
    
    const button = screen.getByRole('button', { name: /keyboard test/i });
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

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
});