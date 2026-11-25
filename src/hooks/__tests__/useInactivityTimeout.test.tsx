import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useInactivityTimeout } from '../useInactivityTimeout';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows warning 60 seconds before 10-minute expiry and triggers timeout', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, onTimeout), { wrapper });

    expect(result.current.showWarning).toBe(false);

    // Advance 9 minutes -> warning should appear
    act(() => {
      vi.advanceTimersByTime(9 * 60 * 1000);
    });
    expect(result.current.showWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(60);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance remaining 60 seconds -> timeout callback fires
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resets countdown when Stay Logged In is called', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityTimeout(true, onTimeout), { wrapper });

    act(() => {
      vi.advanceTimersByTime(9 * 60 * 1000 + 10_000);
    });
    expect(result.current.showWarning).toBe(true);

    act(() => {
      result.current.stayLoggedIn();
    });
    expect(result.current.showWarning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
