import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';

// Test component that uses the Form components
const TestForm = () => {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  it('renders form elements correctly', () => {
    render(<TestForm />);
    
    // Check for labels
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    
    // Check for descriptions
    expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
    expect(screen.getByText('We\'ll never share your email.')).toBeInTheDocument();
    
    // Check for inputs
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('applies correct classes to form elements', () => {
    render(<TestForm />);
    
    // FormItem should have space-y-2 class
    const formItems = document.querySelectorAll('.space-y-2');
    expect(formItems.length).toBe(2);
    
    // FormLabel should be a label element
    const labels = screen.getAllByText(/Username|Email/);
    labels.forEach(label => {
      expect(label.tagName).toBe('LABEL');
    });
    
    // FormDescription should have text-sm class
    const descriptions = screen.getAllByText(/public display name|never share your email/);
    descriptions.forEach(desc => {
      expect(desc).toHaveClass('text-sm');
    });
  });
});

// Test component with form errors
const TestFormWithErrors = () => {
  const form = useForm({
    defaultValues: {
      username: '',
    },
    // Set up with an error
    resolver: async () => ({
      values: {},
      errors: {
        username: {
          type: 'required',
          message: 'Username is required',
        },
      },
    }),
  });

  // Trigger validation
  form.trigger();

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

describe('Form Components with Errors', () => {
  it('displays error messages', async () => {
    render(<TestFormWithErrors />);
    
    // Error message should be displayed
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    
    // Error message should have the destructive class
    const errorMessage = screen.getByText('Username is required');
    expect(errorMessage).toHaveClass('text-destructive');
    
    // Label should have the destructive class when there's an error
    const label = screen.getByText('Username');
    expect(label).toHaveClass('text-destructive');
  });
});
