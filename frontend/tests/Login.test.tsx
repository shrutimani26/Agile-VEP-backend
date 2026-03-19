import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockLoginUser = vi.fn();
const mockLogout    = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Default: no user logged in
let mockUser: any = null;

vi.mock('@/Auth/useAuth', () => ({
  useAuth: () => ({
    user:      mockUser,
    loginUser: mockLoginUser,
    logout:    mockLogout,
  }),
}));

import Login from '../pages/Login'; // adjust path as needed

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderLogin = (role: UserRole) =>
  render(
    <MemoryRouter>
      <Login role={role} onBack={vi.fn()} />
    </MemoryRouter>
  );

const fillAndSubmit = (email: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null; // reset to logged-out state
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders "Driver Login" heading for the DRIVER role', () => {
    renderLogin(UserRole.DRIVER);
    expect(screen.getByText('Driver Login')).toBeInTheDocument();
  });

  it('renders "Officer Login" heading for the OFFICER role', () => {
    renderLogin(UserRole.OFFICER);
    expect(screen.getByText('Officer Login')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderLogin(UserRole.DRIVER);
    expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  it('renders a "Create Driver Account" link for DRIVER role', () => {
    renderLogin(UserRole.DRIVER);
    expect(screen.getByRole('link', { name: /create driver account/i })).toBeInTheDocument();
  });

  it('does NOT render "Create Driver Account" link for OFFICER role', () => {
    renderLogin(UserRole.OFFICER);
    expect(screen.queryByRole('link', { name: /create driver account/i })).not.toBeInTheDocument();
  });

  it('shows driver demo credentials for DRIVER role', () => {
    renderLogin(UserRole.DRIVER);
    expect(screen.getByText(/mdriver1@gmail\.com/i)).toBeInTheDocument();
  });

  it('shows officer demo credentials for OFFICER role', () => {
    renderLogin(UserRole.OFFICER);
    expect(screen.getByText(/officer1@lta\.gov\.sg/i)).toBeInTheDocument();
  });

  // ── Successful login ───────────────────────────────────────────────────────

  it('calls loginUser with entered email and password on submit', async () => {
    mockLoginUser.mockResolvedValue({ role: UserRole.DRIVER });
    renderLogin(UserRole.DRIVER);
    fillAndSubmit('driver@test.com', 'password123');
    await waitFor(() =>
      expect(mockLoginUser).toHaveBeenCalledWith('driver@test.com', 'password123')
    );
  });

  it('navigates to /driver/vehicles on successful DRIVER login', async () => {
    mockLoginUser.mockResolvedValue({ role: UserRole.DRIVER });
    renderLogin(UserRole.DRIVER);
    fillAndSubmit('driver@test.com', 'password123');
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/driver/vehicles')
    );
  });

  it('navigates to /officer/queue on successful OFFICER login', async () => {
    mockLoginUser.mockResolvedValue({ role: UserRole.OFFICER });
    renderLogin(UserRole.OFFICER);
    fillAndSubmit('officer@lta.gov.sg', 'password123');
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/officer/queue')
    );
  });

  // ── Role mismatch ──────────────────────────────────────────────────────────

  it('shows an error when a driver tries to log in via the officer portal', async () => {
    mockLoginUser.mockResolvedValue({ role: UserRole.DRIVER });
    renderLogin(UserRole.OFFICER);
    fillAndSubmit('driver@test.com', 'password123');
    await waitFor(() =>
      expect(screen.getByText(/invalid role for this login portal/i)).toBeInTheDocument()
    );
  });

  it('does NOT navigate when there is a role mismatch', async () => {
    mockLoginUser.mockResolvedValue({ role: UserRole.DRIVER });
    renderLogin(UserRole.OFFICER);
    fillAndSubmit('driver@test.com', 'password123');
    await waitFor(() => screen.getByText(/invalid role/i));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Failed login ───────────────────────────────────────────────────────────

  it('shows server error message when login throws with a response error', async () => {
    mockLoginUser.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    renderLogin(UserRole.DRIVER);
    fillAndSubmit('bad@test.com', 'wrongpassword');
    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    );
  });

  it('shows fallback "Login failed" when error has no response body', async () => {
    mockLoginUser.mockRejectedValue(new Error('Network error'));
    renderLogin(UserRole.DRIVER);
    fillAndSubmit('bad@test.com', 'wrongpassword');
    await waitFor(() =>
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    );
  });

  it('clears a previous error message on a new submit attempt', async () => {
    // First attempt fails
    mockLoginUser.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin(UserRole.DRIVER);
    fillAndSubmit('bad@test.com', 'wrong');
    await waitFor(() => screen.getByText('Invalid credentials'));

    // Second attempt succeeds
    mockLoginUser.mockResolvedValueOnce({ role: UserRole.DRIVER });
    fillAndSubmit('driver@test.com', 'correct');
    await waitFor(() =>
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    );
  });

  // ── Already logged-in user (useEffect redirect) ───────────────────────────

  it('redirects to /driver/vehicles if a DRIVER user is already logged in', () => {
    mockUser = { role: UserRole.DRIVER };
    renderLogin(UserRole.DRIVER);
    expect(mockNavigate).toHaveBeenCalledWith('/driver/vehicles');
  });

  it('redirects to /officer/queue if an OFFICER user is already logged in', () => {
    mockUser = { role: UserRole.OFFICER };
    renderLogin(UserRole.OFFICER);
    expect(mockNavigate).toHaveBeenCalledWith('/officer/queue');
  });

  it('calls logout if logged-in user role does not match the portal role', () => {
    // A driver lands on the officer login portal
    mockUser = { role: UserRole.DRIVER };
    renderLogin(UserRole.OFFICER);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
