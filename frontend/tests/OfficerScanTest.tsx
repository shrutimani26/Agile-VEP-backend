import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OfficerScan from '../pages/OfficerScan';
import { ApplicationStatus, CrossingDirection } from '../types';

// =============================================================================
// MOCKING (Unit Testing: Isolation)
// -----------------------------------------------------------------------------
// OfficerScan depends on DBService for application lookups, vehicle lookups,
// and crossing logs. We mock the entire module so tests run without a real
// localStorage or backend, keeping them fast and independent.
// =============================================================================

const mockGetApplications = vi.fn();
const mockGetVehicleById  = vi.fn();
const mockLogCrossing     = vi.fn();

vi.mock('../services/db', () => ({
  DBService: {
    get getApplications() { return mockGetApplications; },
    get getVehicleById()  { return mockGetVehicleById; },
    get logCrossing()     { return mockLogCrossing; },
  },
}));

// =============================================================================
// SHARED TEST DATA
// =============================================================================

const approvedApp = {
  id: 'app-1',
  userId: 'driver-1',
  vehicleId: 'v-1',
  status: ApplicationStatus.APPROVED,
  expiryDate: '2027-01-01T23:59:59Z',
};

const pendingApp = {
  id: 'app-2',
  userId: 'driver-2',
  vehicleId: 'v-2',
  status: ApplicationStatus.PENDING_REVIEW,
};

const blacklistedApp = {
  id: 'app-3',
  userId: 'driver-3',
  vehicleId: 'v-3',
  status: ApplicationStatus.APPROVED,
  expiryDate: '2027-12-31T23:59:59Z',
};

const normalVehicle    = { id: 'v-1', isBlacklisted: false };
const blacklistedVehicle = { id: 'v-3', isBlacklisted: true };

// =============================================================================
// HELPER
// =============================================================================

const renderScan = () =>
  render(
    <MemoryRouter>
      <OfficerScan />
    </MemoryRouter>
  );

const enterToken = (token: string) =>
  fireEvent.change(screen.getByPlaceholderText(/scan or paste token/i), {
    target: { value: token },
  });

const clickVerify = () =>
  fireEvent.click(screen.getByRole('button', { name: /verify/i }));

const scan = (token: string) => {
  enterToken(token);
  clickVerify();
};

// =============================================================================
// TEST SUITE
// =============================================================================

describe('OfficerScan component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogCrossing.mockResolvedValue(undefined);
  });

  // ===========================================================================
  // SECTION 1 — Rendering (Blackbox Testing)
  // ---------------------------------------------------------------------------
  // Verify the UI elements an officer expects to see when the page loads.
  // ===========================================================================

  describe('Rendering', () => {
    it('renders the scanner heading', () => {
      renderScan();
      expect(screen.getByText(/officer scanner/i)).toBeInTheDocument();
    });

    it('renders the token input field', () => {
      renderScan();
      expect(screen.getByPlaceholderText(/scan or paste token/i)).toBeInTheDocument();
    });

    it('renders the VERIFY button', () => {
      renderScan();
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });

    it('renders Entry and Exit direction toggle buttons', () => {
      renderScan();
      expect(screen.getByRole('button', { name: /entry log/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /exit log/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // SECTION 2 — Input Space Partitioning: Token Format
  // ---------------------------------------------------------------------------
  // Partition the token input into:
  //   • Class 1 (invalid): does NOT start with "PERMIT-"
  //   • Class 2 (valid):   starts with "PERMIT-"
  //
  // Format validation is purely client-side, so DBService is never called.
  // ===========================================================================

  describe('Token format validation — Input Space Partitioning', () => {

    // Partition: invalid format (no PERMIT- prefix)
    it('rejects a token that does not start with PERMIT- [partition: invalid format]', async () => {
      renderScan();
      scan('INVALID-TOKEN');
      await waitFor(() =>
        expect(screen.getByText(/invalid token format/i)).toBeInTheDocument()
      );
      expect(mockGetApplications).not.toHaveBeenCalled();
    });

    // Partition: valid format, but no matching application
    it('accepts format but shows "Permit not found" when no application matches [partition: valid format, unknown ID]', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      renderScan();
      scan('PERMIT-app-999');
      await waitFor(() =>
        expect(screen.getByText(/permit not found/i)).toBeInTheDocument()
      );
    });
  });

  // ===========================================================================
  // SECTION 3 — Application Status Check
  // ---------------------------------------------------------------------------
  // Permit status partitions:
  //   • APPROVED  → proceed to vehicle check
  //   • Anything else (PENDING, REJECTED, SUBMITTED) → deny immediately
  // ===========================================================================

  describe('Application status check — Input Space Partitioning', () => {

    // Partition: non-approved status (PENDING_REVIEW)
    it('denies entry when application is not APPROVED [partition: non-approved]', async () => {
      mockGetApplications.mockResolvedValue([pendingApp]);
      renderScan();
      scan('PERMIT-app-2');
      await waitFor(() =>
        expect(screen.getByText(/clearance denied/i)).toBeInTheDocument()
      );
      expect(mockGetVehicleById).not.toHaveBeenCalled();
    });

    // Partition: approved status — vehicle check runs
    it('proceeds to vehicle lookup when application is APPROVED [partition: approved]', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      scan('PERMIT-app-1');
      await waitFor(() =>
        expect(mockGetVehicleById).toHaveBeenCalledWith('v-1')
      );
    });
  });

  // ===========================================================================
  // SECTION 4 — Blacklist Compliance Check (Core User Story)
  // ---------------------------------------------------------------------------
  // This is the primary acceptance criterion:
  //   "Vehicles flagged after QR generation are still denied entry."
  //
  // A vehicle can hold an APPROVED permit yet still be blacklisted post-QR.
  // The scanner must catch this at scan time, not at application approval time.
  //
  // Partitions:
  //   • isBlacklisted = true  → deny entry, log FAIL crossing
  //   • isBlacklisted = false → allow entry, log SUCCESS crossing
  // ===========================================================================

  describe('Blacklist compliance check — core user story', () => {

    // Partition: blacklisted vehicle with otherwise-valid approved permit
    it('denies entry when vehicle is blacklisted despite an APPROVED permit [partition: blacklisted]', async () => {
      mockGetApplications.mockResolvedValue([blacklistedApp]);
      mockGetVehicleById.mockResolvedValue(blacklistedVehicle);
      renderScan();
      scan('PERMIT-app-3');
      await waitFor(() =>
        expect(screen.getByText(/vehicle is blacklisted/i)).toBeInTheDocument()
      );
    });

    // Verify a FAIL crossing is logged so the denial is auditable
    it('logs a FAIL crossing when vehicle is blacklisted [audit trail]', async () => {
      mockGetApplications.mockResolvedValue([blacklistedApp]);
      mockGetVehicleById.mockResolvedValue(blacklistedVehicle);
      renderScan();
      scan('PERMIT-app-3');
      await waitFor(() =>
        expect(mockLogCrossing).toHaveBeenCalledWith(
          expect.objectContaining({
            result: 'FAIL',
            failReason: 'Vehicle blacklisted',
          })
        )
      );
    });

    // Partition: non-blacklisted vehicle — should be authorised
    it('grants entry when vehicle is NOT blacklisted and permit is APPROVED [partition: not blacklisted]', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      scan('PERMIT-app-1');
      await waitFor(() =>
        expect(screen.getByText(/entry authorized/i)).toBeInTheDocument()
      );
    });

    // Verify a SUCCESS crossing is logged for non-blacklisted entry
    it('logs a SUCCESS crossing when entry is authorised [audit trail]', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      scan('PERMIT-app-1');
      await waitFor(() =>
        expect(mockLogCrossing).toHaveBeenCalledWith(
          expect.objectContaining({ result: 'SUCCESS' })
        )
      );
    });
  });

  // ===========================================================================
  // SECTION 5 — Direction Toggle
  // ---------------------------------------------------------------------------
  // The crossing direction (ENTRY / EXIT) affects the log and the UI colour.
  // Verify the toggle changes which direction is recorded.
  // ===========================================================================

  describe('Direction toggle', () => {

    it('logs ENTRY direction by default', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      scan('PERMIT-app-1');
      await waitFor(() =>
        expect(mockLogCrossing).toHaveBeenCalledWith(
          expect.objectContaining({ direction: CrossingDirection.ENTRY })
        )
      );
    });

    it('logs EXIT direction when Exit Log is selected', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      fireEvent.click(screen.getByRole('button', { name: /exit log/i }));
      scan('PERMIT-app-1');
      await waitFor(() =>
        expect(mockLogCrossing).toHaveBeenCalledWith(
          expect.objectContaining({ direction: CrossingDirection.EXIT })
        )
      );
    });
  });

  // ===========================================================================
  // SECTION 6 — Token Matching Strategy (Whitebox)
  // ---------------------------------------------------------------------------
  // The scanner extracts the longest matching segment from the token.
  // e.g. PERMIT-app-1-174051000 → tries "app-1-174051000", then "app-1" (match).
  // This whitebox test confirms the greedy-match algorithm works correctly.
  // ===========================================================================

  describe('Token matching strategy — whitebox', () => {

    it('matches app-1 from a token with a timestamp suffix [greedy match]', async () => {
      mockGetApplications.mockResolvedValue([approvedApp]);
      mockGetVehicleById.mockResolvedValue(normalVehicle);
      renderScan();
      scan('PERMIT-app-1-174051000');
      await waitFor(() =>
        expect(screen.getByText(/entry authorized/i)).toBeInTheDocument()
      );
    });
  });
});
