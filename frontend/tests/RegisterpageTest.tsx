import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register'; // adjust path as needed

// =============================================================================
// MOCKING (Unit Testing: Isolation)
// -----------------------------------------------------------------------------
// The Register component depends on useAuth (registerUser) and useNavigate,
// which are external dependencies. We use vi.fn() to create mock objects —
// these are "test doubles" that simulate real behaviour in a controlled way,
// exactly as described in the "Unit Testing: Mocking" slide.
// =============================================================================

const mockNavigate = vi.fn();
const mockRegisterUser = vi.fn();

// Mock react-router-dom's useNavigate so navigation calls don't require
// a real router environment — keeping the test fast and isolated.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth so the component doesn't try to hit a real backend.
// Using a getter pattern ensures mockRegisterUser is always read at
// call time (avoids Vitest hoisting issues with vi.mock factories).
vi.mock('@/Auth/useAuth', () => ({
  useAuth: () => ({
    get registerUser() { return mockRegisterUser; },
  }),
}));

// =============================================================================
// HELPER
// -----------------------------------------------------------------------------
// Wrapping in MemoryRouter satisfies any internal <Link> / router hooks
// without needing a full browser environment.
// =============================================================================

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

// Helper: fill every field with valid defaults, then override specific ones.
const fillForm = (overrides: Partial<{
  fullName: string;
  email: string;
  phone: string;
  nric: string;
  password: string;
  confirmPassword: string;
}> = {}) => {
  const values = {
    fullName:        'Ahmad Bin Ismail',
    email:           'ahmad@example.com',
    phone:           '012-3456789',
    nric:            'S1234567A',
    password:        'password123',
    confirmPassword: 'password123',
    ...overrides,
  };

  fireEvent.change(screen.getByPlaceholderText(/Ahmad Bin Ismail/i), {
    target: { value: values.fullName },
  });
  fireEvent.change(screen.getByPlaceholderText(/name@gmail\.com/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByPlaceholderText(/012-3456789/i), {
    target: { value: values.phone },
  });
  fireEvent.change(screen.getByPlaceholderText(/S1234567A/i), {
    target: { value: values.nric },
  });

  // There are two password fields — grab them by index
  const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
  fireEvent.change(passwordInputs[0], { target: { value: values.password } });
  fireEvent.change(passwordInputs[1], { target: { value: values.confirmPassword } });
};

const submitForm = () =>
  fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Register component', () => {

  // Reset all mocks before each test so tests remain INDEPENDENT.
  // unit tests must be "Automatic, Repeatable and
  // Independent" — a failed mock state from one test should never bleed
  // into another.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SECTION 1 — Rendering (Blackbox Testing)
  // ---------------------------------------------------------------------------
  // Blackbox testing: we look only at what is VISIBLE to the user (the
  // specification / behaviour), with no knowledge of internal code.
  // We verify that the component renders all the fields a user expects to see.
  // ===========================================================================

  describe('Rendering', () => {
    it('renders the registration heading', () => {
      renderRegister();
      expect(screen.getByText(/driver registration/i)).toBeInTheDocument();
    });

    it('renders all required input fields', () => {
      renderRegister();
      // Each placeholder represents a field the spec says must exist
      expect(screen.getByPlaceholderText(/Ahmad Bin Ismail/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/name@gmail\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/012-3456789/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/S1234567A/i)).toBeInTheDocument();
      // Two password fields expected
      expect(screen.getAllByPlaceholderText(/••••••••/i)).toHaveLength(2);
    });

    it('renders the submit button', () => {
      renderRegister();
      expect(
        screen.getByRole('button', { name: /complete registration/i })
      ).toBeInTheDocument();
    });

    it('renders a "Back to Login" link', () => {
      renderRegister();
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // SECTION 2 — Input Space Partitioning: Password Validation
  // ---------------------------------------------------------------------------
  // For password LENGTH (spec: minimum 6 characters), the partitions are:
  //   • Class 1 (invalid): length < 6  → should show error
  //   • Class 2 (valid):   length >= 6 → should proceed
  //
  // We pick one representative from each class (avoid writing similar cases).
  // ===========================================================================

  describe('Password length validation — Input Space Partitioning', () => {

    // Partition: length < 6 (INVALID class) — representative value: "abc" (3 chars)
    it('shows an error when password is shorter than 6 characters [partition: length < 6]', async () => {
      renderRegister();
      fillForm({ password: 'abc', confirmPassword: 'abc' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument()
      );
    });

    // Partition: length >= 6 (VALID class) — representative value: "abcdef" (6 chars)
    it('does NOT show a length error when password is exactly 6 characters [partition: length >= 6]', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm({ password: 'abcdef', confirmPassword: 'abcdef' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.queryByText(/password must be at least 6 characters/i)
        ).not.toBeInTheDocument()
      );
    });
  });

  // ===========================================================================
  // SECTION 3 — Boundary Value Analysis: Password Length
  // ---------------------------------------------------------------------------
  // For the rule "password must be >= 6 characters", the boundary values are:
  //   • 5 characters → just OUTSIDE the valid range (should fail)
  //   • 6 characters → just INSIDE the valid range (should pass)
  //
  // These boundary cases are the most likely places for bugs like writing
  // "< 6" instead of "<= 6", so we test them explicitly.
  // ===========================================================================

  describe('Boundary Value Analysis — password minimum length (boundary = 6)', () => {

    // Boundary value: 5 characters (one below the limit — should FAIL)
    it('rejects a password of exactly 5 characters [boundary: 5 = 6-1, invalid]', async () => {
      renderRegister();
      fillForm({ password: 'abc12', confirmPassword: 'abc12' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument()
      );
    });

    // Boundary value: 6 characters (exactly at the limit — should PASS)
    it('accepts a password of exactly 6 characters [boundary: 6 = minimum, valid]', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm({ password: 'abc123', confirmPassword: 'abc123' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.queryByText(/password must be at least 6 characters/i)
        ).not.toBeInTheDocument()
      );
    });

    // A value well within the valid range — confirms normal operation
    it('accepts a password well above the minimum [partition: length >> 6]', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm({ password: 'superSecure999!', confirmPassword: 'superSecure999!' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.queryByText(/password must be at least 6 characters/i)
        ).not.toBeInTheDocument()
      );
    });
  });

  // ===========================================================================
  // SECTION 4 — Input Space Partitioning: Password Match
  // ---------------------------------------------------------------------------
  // For the password-match rule, the two partitions are:
  //   • Class 1 (invalid): passwords do NOT match → error shown
  //   • Class 2 (valid):   passwords match         → no error
  // ===========================================================================

  describe('Password match validation — Input Space Partitioning', () => {

    // Partition: passwords do NOT match (INVALID class)
    it('shows an error when passwords do not match [partition: mismatch]', async () => {
      renderRegister();
      fillForm({ password: 'password123', confirmPassword: 'differentPass' });
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      );
    });

    // Partition: passwords match (VALID class)
    it('does NOT show a mismatch error when passwords are identical [partition: match]', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm({ password: 'password123', confirmPassword: 'password123' });
      submitForm();
      await waitFor(() =>
        expect(
          screen.queryByText(/passwords do not match/i)
        ).not.toBeInTheDocument()
      );
    });
  });

  // ===========================================================================
  // SECTION 5 — Successful Registration Flow
  // ---------------------------------------------------------------------------
  // These tests verify the HAPPY PATH — the spec says that on successful
  // registration, registerUser should be called with the correct arguments
  // and the user should be redirected to /login/driver.
  //
  // This is still blackbox: we observe inputs and outputs without caring
  // about internal implementation details.
  // ===========================================================================

  describe('Successful registration', () => {

    it('calls registerUser with the correct form values on valid submit', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() =>
        expect(mockRegisterUser).toHaveBeenCalledWith(
          'ahmad@example.com',
          'password123',
          'Ahmad Bin Ismail',
          '012-3456789',
          'S1234567A'
        )
      );
    });

    it('navigates to /login/driver after successful registration', async () => {
      mockRegisterUser.mockResolvedValue({});
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/login/driver')
      );
    });

    it('does NOT navigate if registration fails', async () => {
      mockRegisterUser.mockRejectedValue(new Error('Email already in use'));
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() => screen.getByText(/email already in use/i));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // SECTION 6 — Error Handling (Set of Invalid Inputs)
  // ---------------------------------------------------------------------------
  // Here we test what happens when the API itself rejects the request
  // (e.g., duplicate email), distinct from client-side validation failures.
  // ===========================================================================

  describe('API error handling — set of invalid inputs', () => {

    it('shows the server error message when registerUser throws', async () => {
      mockRegisterUser.mockRejectedValue(new Error('Email already in use'));
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
      );
    });

    it('shows a fallback error message when the error has no message', async () => {
      mockRegisterUser.mockRejectedValue({});
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() =>
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
      );
    });

    it('clears a previous error on a new submit attempt', async () => {
      // First attempt fails
      mockRegisterUser.mockRejectedValueOnce(new Error('Email already in use'));
      renderRegister();
      fillForm();
      submitForm();
      await waitFor(() => screen.getByText(/email already in use/i));

      // Second attempt succeeds — previous error should disappear
      mockRegisterUser.mockResolvedValueOnce({});
      submitForm();
      await waitFor(() =>
        expect(
          screen.queryByText(/email already in use/i)
        ).not.toBeInTheDocument()
      );
    });
  });

  // ===========================================================================
  // SECTION 7 — Validation Order (Whitebox awareness)
  // ---------------------------------------------------------------------------
  // Knowing the internal code (whitebox), we can see that the password-match
  // check runs BEFORE the length check. This test verifies that ordering so
  // that both code paths are exercised — complementing our blackbox tests.
  // ===========================================================================

  describe('Validation ordering — whitebox awareness', () => {

    it('shows "passwords do not match" before "too short" when both fail', async () => {
      renderRegister();
      // Both conditions are broken: passwords don't match AND are too short
      fillForm({ password: 'abc', confirmPassword: 'xyz' });
      submitForm();
      await waitFor(() =>
        // Match error should appear (it is checked first in the source code)
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      );
      // Length error should NOT also appear simultaneously
      expect(
        screen.queryByText(/password must be at least 6 characters/i)
      ).not.toBeInTheDocument();
    });
  });

});