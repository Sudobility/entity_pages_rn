/**
 * Test utilities for rendering hooks and components.
 *
 * Lightweight helpers for testing React hooks and components in a
 * jsdom environment using react-dom with proper async support via `act`.
 */
import React from 'react';

const ReactDOMClient = require('react-dom/client');

const { act: reactAct } = require('react');

/**
 * Renders a hook in a wrapper and returns the result.
 * Uses async act to properly flush effects, including resolved promises.
 */
export async function renderHook<T>(
  hookFn: () => T,
  options?: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  }
): Promise<{ result: { current: T }; unmount: () => void }> {
  const result: { current: T } = {} as { current: T };

  function TestComponent() {
    result.current = hookFn();
    return null;
  }

  const element = options?.wrapper ? (
    <options.wrapper>
      <TestComponent />
    </options.wrapper>
  ) : (
    <TestComponent />
  );

  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);

  await reactAct(async () => {
    root.render(element);
  });

  return {
    result,
    unmount: () => {
      reactAct(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

interface RenderResult {
  container: HTMLElement;
  getByText: (text: string) => HTMLElement;
  queryByText: (text: string | RegExp) => HTMLElement | null;
  getAllByText: (text: string | RegExp) => HTMLElement[];
  unmount: () => void;
}

/**
 * Finds all elements containing the given text by checking element
 * textContent. Handles cases where JSX interpolation creates multiple
 * text nodes within one element.
 */
function findByTextContent(
  container: HTMLElement,
  text: string | RegExp
): HTMLElement[] {
  const results: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  const elements = container.querySelectorAll('*');
  for (const el of elements) {
    const htmlEl = el as HTMLElement;
    const directText = getDirectTextContent(htmlEl);
    const matches =
      typeof text === 'string'
        ? directText.includes(text)
        : text.test(directText);
    if (matches && !seen.has(htmlEl)) {
      seen.add(htmlEl);
      results.push(htmlEl);
    }
  }

  return results;
}

/**
 * Gets the direct text content of an element, concatenating only its
 * immediate text node children (not text from nested elements).
 */
function getDirectTextContent(el: HTMLElement): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
    }
  }
  return text;
}

/**
 * Renders a React element into a DOM container.
 * Uses async act to properly flush effects (including resolved promises).
 * Returns query helpers for assertions.
 */
export async function render(
  element: React.ReactElement
): Promise<RenderResult> {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = ReactDOMClient.createRoot(container);

  await reactAct(async () => {
    root.render(element);
  });

  const getByText = (text: string): HTMLElement => {
    const results = findByTextContent(container, text);
    if (results.length === 0) {
      throw new Error(`Text "${text}" not found`);
    }
    return results[0];
  };

  const queryByText = (text: string | RegExp): HTMLElement | null => {
    const results = findByTextContent(container, text);
    return results.length > 0 ? results[0] : null;
  };

  const getAllByText = (text: string | RegExp): HTMLElement[] => {
    return findByTextContent(container, text);
  };

  return {
    container,
    getByText,
    queryByText,
    getAllByText,
    unmount: () => {
      reactAct(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/**
 * Simulates pressing an element by dispatching a click event.
 */
export function firePress(element: HTMLElement): void {
  reactAct(() => {
    element.click();
  });
}

/**
 * Flush all promises (microtasks) within act.
 */
export async function flushPromises(): Promise<void> {
  await reactAct(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

/**
 * Types into a controlled text field: sets the value the way a browser would,
 * so React's `onChange` fires.
 */
export function changeText(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  reactAct(() => {
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
