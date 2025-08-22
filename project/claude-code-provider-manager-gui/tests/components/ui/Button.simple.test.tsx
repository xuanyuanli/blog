import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component (Simple)', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  test('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  test('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});