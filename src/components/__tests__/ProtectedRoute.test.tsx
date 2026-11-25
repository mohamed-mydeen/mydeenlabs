import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({ user: null, session: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Dashboard')).toBeNull();
    expect(screen.getByText('Login Screen')).toBeTruthy();
  });

  it('renders protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'admin@mydeen.dev' },
      session: { access_token: 'tok' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Dashboard')).toBeTruthy();
  });
});
