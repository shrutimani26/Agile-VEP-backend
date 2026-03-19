import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/api.service', () => ({
  default: {
    Application: {
      getAll: vi.fn(),
    },
  },
}));

import Vehicles from '../pages/Vehicles';
import apiService from '@/api/api.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const SOON_DATE   = new Date(Date.now() +  7 * 24 * 60 * 60 * 1000).toISOString();
const PAST_DATE   = new Date('2023-01-01').toISOString();

const baseVehicle = {
  id: 'v1',
  plateNo: 'WXY 1234',
  make: 'Toyota',
  model: 'Hilux',
  year: 2021,
  vin: 'JT3HN86R8X0123456',
  insuranceExpiry: FUTURE_DATE,
};

const makeApp = (overrides: Record<string, any> = {}): any => ({
  id: 'app-1',
  status: 'APPROVED',
  submittedAt: '2024-06-01T00:00:00Z',
  decisionReason: null,
  vehicle: baseVehicle,
  ...overrides,
});

const renderVehicles = () =>
  render(<MemoryRouter><Vehicles /></MemoryRouter>);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Vehicles page', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Loading / Error / Empty ────────────────────────────────────────────────

  it('shows loading state while the API call is pending', () => {
    (apiService.Application.getAll as any).mockReturnValue(new Promise(() => {}));
    renderVehicles();
    expect(screen.getByText(/loading vehicles/i)).toBeInTheDocument();
  });

  it('shows an error message when the API call fails', async () => {
    (apiService.Application.getAll as any).mockRejectedValue(new Error('Network error'));
    renderVehicles();
    await waitFor(() =>
      expect(screen.getByText(/failed to load vehicles/i)).toBeInTheDocument()
    );
  });

  it('shows empty state and CTA when there are no applications', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([]);
    renderVehicles();
    await waitFor(() =>
      expect(screen.getByText(/no applications found/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/start your first application/i)).toBeInTheDocument();
  });

  // ── Approved — active vehicle ──────────────────────────────────────────────

  it('renders plate number and make/model for an approved vehicle', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => expect(screen.getByText('WXY 1234')).toBeInTheDocument());
    expect(screen.getByText(/toyota hilux/i)).toBeInTheDocument();
  });

  it('shows ACTIVE badge for an approved, non-expired vehicle', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => expect(screen.getByText('ACTIVE')).toBeInTheDocument());
  });

  it('shows "Expiring Soon" badge when insurance expires within 14 days', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ vehicle: { ...baseVehicle, insuranceExpiry: SOON_DATE } }),
    ]);
    renderVehicles();
    await waitFor(() =>
      expect(screen.getByText(/expiring soon/i)).toBeInTheDocument()
    );
  });

  it('navigates to the permit page when "Generate QR" is clicked', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /generate qr/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate qr/i }));
    expect(mockNavigate).toHaveBeenCalledWith(`/driver/permit/${baseVehicle.id}`);
  });

  // ── Approved — expired insurance ───────────────────────────────────────────

  it('shows EXPIRED badge when insurance has expired on an approved application', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ vehicle: { ...baseVehicle, insuranceExpiry: PAST_DATE } }),
    ]);
    renderVehicles();
    await waitFor(() => expect(screen.getByText('EXPIRED')).toBeInTheDocument());
  });

  it('disables "Generate QR" button when insurance is expired', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ vehicle: { ...baseVehicle, insuranceExpiry: PAST_DATE } }),
    ]);
    renderVehicles();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate qr/i })).toBeDisabled();
    });
  });

  // ── Non-approved statuses ──────────────────────────────────────────────────

  it('shows the correct status message for SUBMITTED applications', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ status: 'SUBMITTED' }),
    ]);
    renderVehicles();
    await waitFor(() =>
      expect(screen.getByText(/awaiting review/i)).toBeInTheDocument()
    );
  });

  it('shows the correct status message for PENDING REVIEW applications', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ status: 'PENDING REVIEW' }),
    ]);
    renderVehicles();
    await waitFor(() =>
      expect(screen.getByText(/currently being reviewed/i)).toBeInTheDocument()
    );
  });

  it('shows "New Application" button for REJECTED applications', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ status: 'REJECTED' }),
    ]);
    renderVehicles();
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /new application/i }).length
      ).toBeGreaterThan(0)
    );
  });

  it('does NOT show a "New Application" card button for SUBMITTED status', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ status: 'SUBMITTED' }),
    ]);
    renderVehicles();
    await waitFor(() => screen.getByText(/awaiting review/i));
    // The header Link exists but no card-level button should be present
    expect(screen.queryAllByRole('button', { name: /new application/i })).toHaveLength(0);
  });

  // ── DetailsModal ───────────────────────────────────────────────────────────

  it('opens DetailsModal with correct permit ID when "View Details" is clicked', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
    expect(screen.getByText('Permit #app-1')).toBeInTheDocument();
  });

  it('closes DetailsModal when the close button is clicked', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Vehicle Details')).not.toBeInTheDocument();
  });

  it('closes DetailsModal when clicking the backdrop', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    const backdrop = screen.getByText('Vehicle Details').closest('.fixed')!;
    fireEvent.click(backdrop);
    expect(screen.queryByText('Vehicle Details')).not.toBeInTheDocument();
  });

  it('shows vehicle plate and VIN inside the modal', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.getAllByText('WXY 1234').length).toBeGreaterThan(0);
    expect(screen.getByText('JT3HN86R8X0123456')).toBeInTheDocument();
  });

  it('shows decisionReason in the modal when present', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([
      makeApp({ status: 'REJECTED', decisionReason: 'Missing documents' }),
    ]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.getByText('Missing documents')).toBeInTheDocument();
  });

  it('does not show the Reason row when decisionReason is null', async () => {
    (apiService.Application.getAll as any).mockResolvedValue([makeApp()]);
    renderVehicles();
    await waitFor(() => screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.queryByText('Reason')).not.toBeInTheDocument();
  });
});
