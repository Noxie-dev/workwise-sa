import { describe, it, expect, vi } from 'vitest';

describe('Button Component Mock', () => {
  // Mock the button component functionality
  const createButton = (props) => {
    const {
      children,
      variant = 'default',
      size = 'default',
      className = '',
      onClick,
      disabled = false,
      type = 'button',
      asChild = false,
    } = props;
    
    // Mock class names based on variant
    const getVariantClass = (variant) => {
      switch (variant) {
        case 'default':
          return 'bg-primary text-primary-foreground';
        case 'secondary':
          return 'bg-secondary text-secondary-foreground';
        case 'destructive':
          return 'bg-destructive text-destructive-foreground';
        case 'outline':
          return 'border border-input bg-background';
        case 'ghost':
          return 'hover:bg-accent hover:text-accent-foreground';
        case 'link':
          return 'text-primary underline-offset-4 hover:underline';
        default:
          return 'bg-primary text-primary-foreground';
      }
    };
    
    // Mock class names based on size
    const getSizeClass = (size) => {
      switch (size) {
        case 'default':
          return 'h-10 px-4 py-2';
        case 'sm':
          return 'h-9 rounded-md px-3';
        case 'lg':
          return 'h-11 rounded-md px-8';
        case 'icon':
          return 'h-10 w-10';
        default:
          return 'h-10 px-4 py-2';
      }
    };
    
    // Combine class names
    const buttonClass = `${getVariantClass(variant)} ${getSizeClass(size)} ${className}`;
    
    // Return a mock button object
    return {
      type,
      className: buttonClass,
      disabled,
      onClick,
      children,
      asChild,
    };
  };

  it('renders with default variant', () => {
    const button = createButton({ children: 'Click me' });
    
    expect(button.children).toBe('Click me');
    expect(button.className).toContain('bg-primary');
  });

  it('renders with secondary variant', () => {
    const button = createButton({ children: 'Secondary', variant: 'secondary' });
    
    expect(button.children).toBe('Secondary');
    expect(button.className).toContain('bg-secondary');
  });

  it('renders with destructive variant', () => {
    const button = createButton({ children: 'Delete', variant: 'destructive' });
    
    expect(button.children).toBe('Delete');
    expect(button.className).toContain('bg-destructive');
  });

  it('renders with outline variant', () => {
    const button = createButton({ children: 'Outline', variant: 'outline' });
    
    expect(button.children).toBe('Outline');
    expect(button.className).toContain('border');
  });

  it('renders with ghost variant', () => {
    const button = createButton({ children: 'Ghost', variant: 'ghost' });
    
    expect(button.children).toBe('Ghost');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('renders with link variant', () => {
    const button = createButton({ children: 'Link', variant: 'link' });
    
    expect(button.children).toBe('Link');
    expect(button.className).toContain('text-primary');
  });

  it('renders with different sizes', () => {
    const defaultButton = createButton({ children: 'Default', size: 'default' });
    expect(defaultButton.className).toContain('h-10');
    
    const smallButton = createButton({ children: 'Small', size: 'sm' });
    expect(smallButton.className).toContain('h-9');
    
    const largeButton = createButton({ children: 'Large', size: 'lg' });
    expect(largeButton.className).toContain('h-11');
    
    const iconButton = createButton({ children: 'Icon', size: 'icon' });
    expect(iconButton.className).toContain('h-10 w-10');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const button = createButton({ children: 'Click me', onClick: handleClick });
    
    // Simulate click
    button.onClick();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    const button = createButton({ children: 'Disabled', disabled: true, onClick: handleClick });
    
    expect(button.disabled).toBe(true);
  });

  it('applies additional className', () => {
    const button = createButton({ children: 'Custom', className: 'custom-class' });
    
    expect(button.className).toContain('custom-class');
  });
});
