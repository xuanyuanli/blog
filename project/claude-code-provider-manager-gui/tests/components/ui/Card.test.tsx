import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardActions } from '@/components/ui/Card';

describe('Card Component', () => {
  describe('Card', () => {
    test('renders basic card', () => {
      render(<Card>Test content</Card>);
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      
      // Check card container has correct classes
      const card = document.querySelector('.bg-white.rounded-lg.shadow-md');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border', 'border-gray-200');
    });

    test('renders with custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      
      const card = document.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'rounded-lg'); // should still have base classes
    });

    test('renders children correctly', () => {
      render(
        <Card>
          <span>Child 1</span>
          <span>Child 2</span>
        </Card>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    test('handles complex children', () => {
      render(
        <Card>
          <div data-testid="complex-child">
            <h1>Title</h1>
            <p>Description</p>
          </div>
        </Card>
      );
      
      const complexChild = screen.getByTestId('complex-child');
      expect(complexChild).toBeInTheDocument();
      expect(screen.getByRole('heading')).toHaveTextContent('Title');
    });
  });

  describe('CardHeader', () => {
    test('renders card header', () => {
      render(<CardHeader>Header content</CardHeader>);
      
      expect(screen.getByText('Header content')).toBeInTheDocument();
      
      const header = document.querySelector('.px-6.py-4.border-b');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('border-gray-200');
    });

    test('renders with custom className', () => {
      render(<CardHeader className="header-custom">Header</CardHeader>);
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      
      const header = document.querySelector('.header-custom');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('px-6', 'py-4');
    });

    test('renders header children correctly', () => {
      render(
        <CardHeader>
          <h2>Card Title</h2>
          <span>Subtitle</span>
        </CardHeader>
      );
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Card Title');
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    test('renders card content', () => {
      render(<CardContent>Content text</CardContent>);
      
      expect(screen.getByText('Content text')).toBeInTheDocument();
      
      const content = document.querySelector('.px-6.py-4:not(.border-b):not(.bg-gray-50)');
      expect(content).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      render(<CardContent className="content-custom">Content</CardContent>);
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      
      const content = document.querySelector('.content-custom');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('px-6', 'py-4');
    });

    test('renders content children correctly', () => {
      render(
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </CardContent>
      );
      
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('CardActions', () => {
    test('renders card actions', () => {
      render(<CardActions>Actions content</CardActions>);
      
      expect(screen.getByText('Actions content')).toBeInTheDocument();
      
      const actions = document.querySelector('.bg-gray-50.border-t');
      expect(actions).toBeInTheDocument();
      expect(actions).toHaveClass('px-6', 'py-4', 'border-gray-200');
    });

    test('renders with custom className', () => {
      render(<CardActions className="actions-custom">Actions</CardActions>);
      
      expect(screen.getByText('Actions')).toBeInTheDocument();
      
      const actions = document.querySelector('.actions-custom');
      expect(actions).toBeInTheDocument();
      expect(actions).toHaveClass('px-6', 'py-4', 'bg-gray-50');
    });

    test('renders action buttons correctly', () => {
      render(
        <CardActions>
          <button>Cancel</button>
          <button>Save</button>
        </CardActions>
      );
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('Full Card Composition', () => {
    test('renders complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardActions>
            <button>Action</button>
          </CardActions>
        </Card>
      );
      
      // Verify all parts are rendered
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Card Title');
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      
      // Verify structure
      const card = document.querySelector('.bg-white.rounded-lg.shadow-md');
      expect(card).toBeInTheDocument();
    });

    test('works with only header and content', () => {
      render(
        <Card>
          <CardHeader>Header Only</CardHeader>
          <CardContent>Content Only</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Header Only')).toBeInTheDocument();
      expect(screen.getByText('Content Only')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('works with only content', () => {
      render(
        <Card>
          <CardContent>Just content</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    test('handles empty card', () => {
      render(<Card></Card>);
      
      // Card should still render with base styles
      const card = document.querySelector('.bg-white.rounded-lg.shadow-md');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    test('maintains visual hierarchy', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardActions>Actions</CardActions>
        </Card>
      );
      
      // Check elements exist
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      
      // Header should have bottom border
      const header = document.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      
      // Actions should have top border and gray background
      const actions = document.querySelector('.border-t.bg-gray-50');
      expect(actions).toBeInTheDocument();
    });

    test('applies consistent padding', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardActions>Actions</CardActions>
        </Card>
      );
      
      // Check elements exist
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      
      // All sections should have same padding
      const paddedElements = document.querySelectorAll('.px-6.py-4');
      expect(paddedElements.length).toBe(3); // Header, Content, Actions
    });

    test('handles long content gracefully', () => {
      const longText = 'A'.repeat(1000);
      render(
        <Card>
          <CardHeader>{longText}</CardHeader>
          <CardContent>{longText}</CardContent>
          <CardActions>
            <button>{longText}</button>
          </CardActions>
        </Card>
      );
      
      // All long text should be rendered
      expect(screen.getAllByText(longText)).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    test('maintains semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <h1>Main Title</h1>
          </CardHeader>
          <CardContent>
            <p>Description paragraph</p>
          </CardContent>
          <CardActions>
            <button aria-label="Primary action">Click me</button>
          </CardActions>
        </Card>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Primary action' })).toBeInTheDocument();
    });

    test('supports ARIA attributes', () => {
      render(
        <Card>
          <CardContent>
            <div role="region" aria-label="Card content">
              Content with ARIA
            </div>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByRole('region', { name: 'Card content' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined children', () => {
      render(
        <Card>
          {undefined}
          <CardContent>Valid content</CardContent>
          {null}
        </Card>
      );
      
      expect(screen.getByText('Valid content')).toBeInTheDocument();
    });

    test('handles mixed content types', () => {
      render(
        <Card>
          Plain text
          <CardContent>Component content</CardContent>
          <span>Inline element</span>
        </Card>
      );
      
      expect(screen.getByText('Plain text')).toBeInTheDocument();
      expect(screen.getByText('Component content')).toBeInTheDocument();
      expect(screen.getByText('Inline element')).toBeInTheDocument();
    });

    test('handles empty className prop', () => {
      render(
        <Card className="">
          <CardHeader className="">Header</CardHeader>
          <CardContent className="">Content</CardContent>
          <CardActions className="">Actions</CardActions>
        </Card>
      );
      
      // Should still render with base classes
      expect(screen.getByText('Header')).toBeInTheDocument();
      
      const paddedElement = document.querySelector('.px-6.py-4');
      expect(paddedElement).toBeInTheDocument();
    });
  });
});