import { 
  User, UserRole, Vehicle, Application, ApplicationStatus, 
  Crossing, Notification, CrossingDirection 
} from '../types';

const DB_KEY = 'vehicle_passport_db';

// ── QR Types ───────────────────────────────────────────────────────────────────

export type QRStatus = 'active' | 'used' | 'expired' | 'revoked';
export type QRScanResult = 'success' | 'denied' | 'invalid' | 'expired';

export interface QRCode {
  qrId: string;                  // Primary key
  tokenHash: string;             // Hashed token — never store raw
  purpose: string;               // e.g. 'checkpoint_entry'
  entityType: string;            // e.g. 'vehicle_application'
  entityId: string;              // e.g. 'APP-2026-00981'
  userId: string;                // Owner / requester
  vehicleId: string;             // Linked vehicle
  status: QRStatus;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdBy: string;             // Actor: 'portal_user' | officer id | 'system'
  generationChannel: string;     // e.g. 'web_portal' | 'mobile_app'
}

export interface QRIssueAudit {
  auditId: string;               // Primary key
  qrId: string;                  // FK → qr_codes
  action: string;                // e.g. 'generate_success' | 'generate_failed'
  actorId: string;               // User who triggered issuance
  actorRole: string;             // Role at time of issuance
  requestIp: string;
  eventTime: string;
  result: 'success' | 'failure';
  reasonCode: string;            // Internal — e.g. 'ELIGIBLE_APPROVED'. Do not expose to end users.
}

export interface QRScanLog {
  scanId: string;                // Primary key
  qrId: string | null;           // Null if token was unrecognised
  scanTimestamp: string;
  scannerUserId: string;         // Officer / system performing scan
  scannerRole: string;           // e.g. 'checkpoint_officer'
  scannerDeviceId: string;       // Managed device id
  scannerLocation: string;       // e.g. 'Woodlands Gate A'
  sourceIp: string;
  result: QRScanResult;
  reasonCode: string;            // Internal — e.g. 'VALID_ACTIVE_QR'. Do not return full detail to end user.
  offlineFlag: boolean;
  latencyMs: number;
  requestId: string;             // Trace / correlation id for debugging & SIEM
}

// ── DB Store ───────────────────────────────────────────────────────────────────

interface DBStore {
  users: User[];
  vehicles: Vehicle[];
  applications: Application[];
  crossings: Crossing[];
  notifications: Notification[];
  qrCodes: QRCode[];
  qrIssueAudits: QRIssueAudit[];
  qrScanLogs: QRScanLog[];
}

const initialData: DBStore = {
  users: [
    {
      id: 'officer-1',
      role: UserRole.OFFICER,
      name: 'Officer Wong',
      email: 'officer1@lta.gov.sg',
      password: 'pswd1',
      phone: '+65 9123 4567',
      maskedId: 'SXXXX123A',
      createdAt: new Date().toISOString()
    },
    {
      id: 'officer-2',
      role: UserRole.OFFICER,
      name: 'Officer Lim',
      email: 'officer2@lta.gov.sg',
      password: 'pswd2',
      phone: '+65 9876 5432',
      maskedId: 'SXXXX456B',
      createdAt: new Date().toISOString()
    },
    {
      id: 'officer-3',
      role: UserRole.OFFICER,
      name: 'Officer Singh',
      email: 'officer3@lta.gov.sg',
      password: 'pswd3',
      phone: '+65 8234 5678',
      maskedId: 'SXXXX789C',
      createdAt: new Date().toISOString()
    },
    {
      id: 'driver-1',
      role: UserRole.DRIVER,
      name: 'Ahmad Ismail',
      email: 'mdriver1@gmail.com',
      password: 'password 1',
      phone: '+60 123 456 789',
      maskedId: 'XXXXXX-XX-5432',
      createdAt: new Date().toISOString()
    },
    {
      id: 'driver-2',
      role: UserRole.DRIVER,
      name: 'Siti Aminah',
      email: 'mdriver2@gmail.com',
      password: 'password 2',
      phone: '+60 198 765 432',
      maskedId: 'XXXXXX-XX-1122',
      createdAt: new Date().toISOString()
    },
    {
      id: 'driver-3',
      role: UserRole.DRIVER,
      name: 'Lee Chong Wei',
      email: 'mdriver3@gmail.com',
      password: 'password 3',
      phone: '+60 112 233 445',
      maskedId: 'XXXXXX-XX-9988',
      createdAt: new Date().toISOString()
    }
  ],
  vehicles: [
    {
      id: 'v-1',
      userId: 'driver-1',
      plateNo: 'JRS 2024',
      make: 'Proton',
      model: 'X50',
      year: 2023,
      vin: 'PROX50-00123456',
      insuranceExpiry: '2025-06-15',
      createdAt: new Date().toISOString()
    },
    {
      id: 'v-2',
      userId: 'driver-2',
      plateNo: 'WVV 8888',
      make: 'Perodua',
      model: 'Myvi',
      year: 2021,
      vin: 'PERMY-99887766',
      insuranceExpiry: '2024-05-10',
      createdAt: new Date().toISOString()
    }
  ],
  applications: [
    {
      id: 'app-1',
      userId: 'driver-1',
      vehicleId: 'v-1',
      status: ApplicationStatus.APPROVED,
      submittedAt: '2024-01-01T10:00:00Z',
      reviewedAt: '2024-01-02T14:30:00Z',
      expiryDate: '2025-01-01T23:59:59Z',
      createdAt: '2024-01-01T09:00:00Z',
      paymentStatus: 'PAID',
      documents: []
    },
    {
      id: 'app-2',
      userId: 'driver-2',
      vehicleId: 'v-2',
      status: ApplicationStatus.PENDING_REVIEW,
      submittedAt: '2024-02-15T08:00:00Z',
      createdAt: '2024-02-15T07:30:00Z',
      paymentStatus: 'PAID',
      documents: []
    }
  ],
  crossings: [],
  notifications: [
    {
      id: 'n-1',
      userId: 'driver-1',
      type: 'PERMIT_APPROVED',
      title: 'Application Approved',
      body: 'Your permit for JRS 2024 has been approved. You can now generate your QR code.',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ],

  // ── QR seed data ─────────────────────────────────────────────────────────────
  qrCodes: [
    {
      qrId: 'QR-2026-000001',
      tokenHash: 'f8d8c7a1b2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
      purpose: 'checkpoint_entry',
      entityType: 'vehicle_application',
      entityId: 'app-1',
      userId: 'driver-1',
      vehicleId: 'v-1',
      status: 'active',
      createdAt: '2026-03-13T10:30:00Z',
      expiresAt: '2026-03-13T10:40:00Z',
      usedAt: null,
      revokedAt: null,
      createdBy: 'portal_user',
      generationChannel: 'web_portal'
    }
  ],
  qrIssueAudits: [
    {
      auditId: 'AUD-000001',
      qrId: 'QR-2026-000001',
      action: 'generate_success',
      actorId: 'driver-1',
      actorRole: 'driver',
      requestIp: '203.0.113.12',
      eventTime: '2026-03-13T10:30:01Z',
      result: 'success',
      reasonCode: 'ELIGIBLE_APPROVED'
    }
  ],
  qrScanLogs: [
    {
      scanId: 'SCAN-000001',
      qrId: 'QR-2026-000001',
      scanTimestamp: '2026-03-13T10:35:12Z',
      scannerUserId: 'officer-1',
      scannerRole: 'checkpoint_officer',
      scannerDeviceId: 'DEV-CP-01',
      scannerLocation: 'Woodlands Gate A',
      sourceIp: '198.51.100.25',
      result: 'success',
      reasonCode: 'VALID_ACTIVE_QR',
      offlineFlag: false,
      latencyMs: 142,
      requestId: 'REQ-663001'
    }
  ]
};

// ── DBService ──────────────────────────────────────────────────────────────────

export class DBService {
  private static getStore(): DBStore {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    // Merge in new tables for existing stores that pre-date QR additions
    const stored = JSON.parse(raw) as DBStore;
    return {
      ...stored,
      qrCodes: stored.qrCodes ?? [],
      qrIssueAudits: stored.qrIssueAudits ?? [],
      qrScanLogs: stored.qrScanLogs ?? [],
    };
  }

  private static saveStore(store: DBStore) {
    localStorage.setItem(DB_KEY, JSON.stringify(store));
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  static async getUser(email: string): Promise<User | undefined> {
    return this.getStore().users.find(u => u.email === email);
  }

  static async getUserById(id: string): Promise<User | undefined> {
    return this.getStore().users.find(u => u.id === id);
  }

  // ── Vehicles ───────────────────────────────────────────────────────────────

  static async getVehicles(userId: string): Promise<Vehicle[]> {
    return this.getStore().vehicles.filter(v => v.userId === userId);
  }

  static async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return this.getStore().vehicles.find(v => v.id === id);
  }

  static async addVehicle(vehicle: Vehicle): Promise<void> {
    const store = this.getStore();
    store.vehicles.push(vehicle);
    this.saveStore(store);
  }

  // ── Applications ───────────────────────────────────────────────────────────

  static async getApplications(userId?: string): Promise<Application[]> {
    const apps = this.getStore().applications;
    return userId ? apps.filter(a => a.userId === userId) : apps;
  }

  static async updateApplication(appId: string, updates: Partial<Application>): Promise<void> {
    const store = this.getStore();
    const index = store.applications.findIndex(a => a.id === appId);
    if (index !== -1) {
      store.applications[index] = { ...store.applications[index], ...updates };
      this.saveStore(store);
    }
  }

  static async createApplication(app: Application): Promise<void> {
    const store = this.getStore();
    store.applications.push(app);
    this.saveStore(store);
  }

  // ── Crossings ──────────────────────────────────────────────────────────────

  static async logCrossing(crossing: Crossing): Promise<void> {
    const store = this.getStore();
    store.crossings.push(crossing);
    this.saveStore(store);
  }

  static async getCrossings(userId: string): Promise<Crossing[]> {
    return this.getStore().crossings.filter(c => c.userId === userId);
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  static async getNotifications(userId: string): Promise<Notification[]> {
    return this.getStore().notifications.filter(n => n.userId === userId);
  }

  static async addNotification(notif: Notification): Promise<void> {
    const store = this.getStore();
    store.notifications.push(notif);
    this.saveStore(store);
  }

  // ── QR Codes ───────────────────────────────────────────────────────────────

  static async getQRCode(qrId: string): Promise<QRCode | undefined> {
    return this.getStore().qrCodes.find(q => q.qrId === qrId);
  }

  static async getQRCodesByUser(userId: string): Promise<QRCode[]> {
    return this.getStore().qrCodes.filter(q => q.userId === userId);
  }

  static async getQRCodesByVehicle(vehicleId: string): Promise<QRCode[]> {
    return this.getStore().qrCodes.filter(q => q.vehicleId === vehicleId);
  }

  static async createQRCode(qr: QRCode): Promise<void> {
    const store = this.getStore();
    store.qrCodes.push(qr);
    this.saveStore(store);
  }

  static async updateQRCode(qrId: string, updates: Partial<QRCode>): Promise<void> {
    const store = this.getStore();
    const index = store.qrCodes.findIndex(q => q.qrId === qrId);
    if (index !== -1) {
      store.qrCodes[index] = { ...store.qrCodes[index], ...updates };
      this.saveStore(store);
    }
  }

  /** Mark a QR as used and timestamp it */
  static async consumeQRCode(qrId: string): Promise<void> {
    await this.updateQRCode(qrId, {
      status: 'used',
      usedAt: new Date().toISOString()
    });
  }

  /** Revoke a QR code immediately */
  static async revokeQRCode(qrId: string): Promise<void> {
    await this.updateQRCode(qrId, {
      status: 'revoked',
      revokedAt: new Date().toISOString()
    });
  }

  // ── QR Issue Audits ────────────────────────────────────────────────────────

  static async logQRIssueAudit(audit: QRIssueAudit): Promise<void> {
    const store = this.getStore();
    store.qrIssueAudits.push(audit);
    this.saveStore(store);
  }

  static async getQRIssueAudits(qrId: string): Promise<QRIssueAudit[]> {
    return this.getStore().qrIssueAudits.filter(a => a.qrId === qrId);
  }

  // ── QR Scan Logs ───────────────────────────────────────────────────────────

  static async logQRScan(scan: QRScanLog): Promise<void> {
    const store = this.getStore();
    store.qrScanLogs.push(scan);
    this.saveStore(store);
  }

  static async getQRScanLogs(qrId: string): Promise<QRScanLog[]> {
    return this.getStore().qrScanLogs.filter(s => s.qrId === qrId);
  }

  static async getQRScanLogsByOfficer(scannerUserId: string): Promise<QRScanLog[]> {
    return this.getStore().qrScanLogs.filter(s => s.scannerUserId === scannerUserId);
  }

  static async getQRScanLogsByLocation(location: string): Promise<QRScanLog[]> {
    return this.getStore().qrScanLogs.filter(s => s.scannerLocation === location);
  }
}