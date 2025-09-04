import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../components/ui/input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text'); // Default type
  });

  it('accepts different types', () => {
    const { rerender } = render(<Input type="email" placeholder="Enter email" />);
    
    let input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" placeholder="Enter password" />);
    input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" placeholder="Enter number" />);
    input = screen.getByPlaceholderText('Enter number');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input value="initial" onChange={handleChange} />);
    
    const input = screen.getByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'updated' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('applies additional className', () => {
    render(<Input className="custom-class" placeholder="Custom input" />);
    
    const input = screen.getByPlaceholderText('Custom input');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref test" />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.placeholder).toBe('Ref test');
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(
      <Input 
        placeholder="Focus test" 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
      />
    );
    
    const input = screen.getByPlaceholderText('Focus test');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles key press events', () => {
    const handleKeyDown = vi.fn();
    const handleKeyUp = vi.fn();
    
    render(
      <Input 
        placeholder="Key test" 
        onKeyDown={handleKeyDown} 
        onKeyUp={handleKeyUp} 
      />
    );
    
    const input = screen.getByPlaceholderText('Key test');
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
    expect(handleKeyUp).toHaveBeenCalledTimes(1);
  });

  it('supports required attribute', () => {
    render(<Input required placeholder="Required input" />);
    
    const input = screen.getByPlaceholderText('Required input');
    expect(input).toHaveAttribute('required');
  });

  it('supports readonly attribute', () => {
    render(<Input readOnly value="Read only" />);
    
    const input = screen.getByDisplayValue('Read only');
    expect(input).toHaveAttribute('readonly');
  });

  it('supports maxLength attribute', () => {
    render(<Input maxLength={10} placeholder="Max length input" />);
    
    const input = screen.getByPlaceholderText('Max length input');
    expect(input).toHaveAttribute('maxlength', '10');
  });
});
