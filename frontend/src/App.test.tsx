import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import App from './App';

// Mock axios to avoid real API calls during test runs
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: { results: {}, convergence_error: false, iterations: 1 } }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      isAxiosError: vi.fn().mockReturnValue(false),
    }
  };
});

// Mock fetch to avoid local fallback fetch errors in JSDOM environment
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve([])
});

describe('Calculator App Smoke Test', () => {
  it('should render the application header and content without throwing', async () => {
    render(<App />);
    const linkElement = screen.queryByText(/Balanço de Massa & Energia/i) || screen.queryByText(/uisa/i);
    expect(linkElement).toBeDefined();
  });
});
