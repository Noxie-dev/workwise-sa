import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend({
  toBeInTheDocument(received: unknown) {
    const pass =
      received instanceof HTMLElement
      || received instanceof SVGElement
      || received instanceof Element;

    return {
      pass,
      message: () =>
        pass
          ? 'expected element not to be present in the document'
          : 'expected value to be an Element present in the document',
    };
  },
  toHaveTextContent(received: unknown, expected: string | RegExp) {
    const text = received instanceof Node ? received.textContent ?? '' : '';
    const pass =
      typeof expected === 'string' ? text.includes(expected) : expected.test(text);

    return {
      pass,
      message: () =>
        pass
          ? `expected element text not to match ${String(expected)}`
          : `expected element text "${text}" to match ${String(expected)}`,
    };
  },
  toHaveClass(received: unknown, ...expectedClasses: string[]) {
    const classList =
      received instanceof Element ? Array.from(received.classList.values()) : [];
    const missing = expectedClasses.filter((className) => !classList.includes(className));
    const pass = missing.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `expected element not to include classes ${expectedClasses.join(', ')}`
          : `expected element classes "${classList.join(' ')}" to include ${missing.join(', ')}`,
    };
  },
  toBeDisabled(received: unknown) {
    const pass =
      received instanceof HTMLButtonElement
      || received instanceof HTMLInputElement
      || received instanceof HTMLSelectElement
      || received instanceof HTMLTextAreaElement
        ? received.disabled
        : false;

    return {
      pass,
      message: () => (pass ? 'expected element not to be disabled' : 'expected element to be disabled'),
    };
  },
  toHaveAttribute(received: unknown, name: string, expectedValue?: string) {
    const actualValue = received instanceof Element ? received.getAttribute(name) : null;
    const pass =
      expectedValue === undefined ? actualValue !== null : actualValue === expectedValue;

    return {
      pass,
      message: () =>
        pass
          ? `expected element not to have attribute ${name}${expectedValue ? `="${expectedValue}"` : ''}`
          : `expected element to have attribute ${name}${expectedValue ? `="${expectedValue}"` : ''}, received ${actualValue}`,
    };
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
