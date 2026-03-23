import React, { useState, useRef } from 'react';
import apiService from '@/api/api.service';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────
interface UploadedFile {
  file: File;
  preview?: string;
}

interface DocumentState {
  vehiclePhotos: UploadedFile[];
  identityCard: UploadedFile | null;
  employmentPass: UploadedFile | null;
  vehicleRegistration: UploadedFile | null;
  roadTax: UploadedFile | null;
  insurance: UploadedFile | null;
}

interface UploadModalProps {
  title: string;
  description: string;
  multiple?: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  existing: UploadedFile | UploadedFile[] | null;
}

// ── Upload Modal ───────────────────────────────────────────────────────────────
const UploadModal: React.FC<UploadModalProps> = ({
  title, description, multiple = false, onClose, onUpload, existing
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setStaged(prev => multiple ? [...prev, ...arr] : arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleConfirm = () => {
    if (staged.length === 0) return;
    onUpload(staged);
    onClose();
  };

  const existingArr = existing
    ? Array.isArray(existing) ? existing : [existing]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Already uploaded */}
          {existingArr.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Already uploaded</p>
              {existingArr.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{u.file.name}</p>
                    <p className="text-xs text-slate-400">{(u.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">Drop files here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 10 MB{multiple ? ' each' : ''}</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple={multiple}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Staged preview */}
          {staged.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready to upload</p>
              {staged.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => setStaged(prev => prev.filter((_, j) => j !== i))}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:underline">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={staged.length === 0}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Upload
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Doc row component ──────────────────────────────────────────────────────────
interface DocRowProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  uploaded: UploadedFile | UploadedFile[] | null;
  onOpen: () => void;
}

const DocRow: React.FC<DocRowProps> = ({ label, required, optional, uploaded, onOpen }) => {
  const count = uploaded
    ? Array.isArray(uploaded) ? uploaded.length : 1
    : 0;
  const isDone = count > 0;

  return (
    <div
      onClick={onOpen}
      className={`p-4 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
        isDone
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-dashed border-slate-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
        }`}>
          {isDone ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        <div>
          <p className={`font-bold text-sm ${isDone ? 'text-emerald-800' : 'text-slate-700'}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {optional && <span className="text-slate-400 ml-1 font-normal text-xs">(optional)</span>}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isDone ? `${count} file${count > 1 ? 's' : ''} uploaded` : 'PDF, JPG, or PNG — max 10 MB'}
          </p>
        </div>
      </div>
      <span className={`text-sm font-bold flex-shrink-0 ml-4 ${isDone ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
        {isDone ? 'Change' : 'Upload'}
      </span>
    </div>
  );
};

// ── Main Wizard ────────────────────────────────────────────────────────────────
const ApplicationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [vehicleData, setVehicleData] = useState({
    plateNo: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    insuranceExpiry: '',
    email: '',
  });

  // Step 2 state
  const [docs, setDocs] = useState<DocumentState>({
    vehiclePhotos: [],
    identityCard: null,
    employmentPass: null,
    vehicleRegistration: null,
    roadTax: null,
    insurance: null,
  });
  const [activeModal, setActiveModal] = useState<keyof DocumentState | null>(null);

  // Step 3 state
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Today's date string for the min attribute (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!vehicleData.plateNo || !vehicleData.make || !vehicleData.model || !vehicleData.vin || !vehicleData.insuranceExpiry) {
      setError('Please fill in all vehicle fields before proceeding.');
      return false;
    }
    if (!vehicleData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vehicleData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (vehicleData.vin.length !== 17) {
      setError('VIN must be exactly 17 characters long.');
      return false;
    }
    // ── Insurance expiry must not be in the past ──────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(vehicleData.insuranceExpiry) < today) {
      setError('Insurance expiry date cannot be in the past.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    const required: Array<[keyof DocumentState, string]> = [
      ['identityCard', 'Identity Card / Passport'],
      ['employmentPass', 'Employment / Immigration Pass'],
      ['vehicleRegistration', 'Vehicle Registration Certificate'],
      ['insurance', 'Certificate of Insurance'],
    ];
    for (const [key, label] of required) {
      if (!docs[key]) {
        setError(`Please upload your ${label} before proceeding.`);
        return false;
      }
    }
    if (docs.vehiclePhotos.length === 0) {
      setError('Please upload at least one photograph of your vehicle.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    nextStep();
  };

  // ── Upload helpers ────────────────────────────────────────────────────────
  const handleUpload = (key: keyof DocumentState, files: File[]) => {
    const uploads: UploadedFile[] = files.map(f => ({ file: f }));
    if (key === 'vehiclePhotos') {
      setDocs(prev => ({ ...prev, vehiclePhotos: [...prev.vehiclePhotos, ...uploads] }));
    } else {
      setDocs(prev => ({ ...prev, [key]: uploads[0] }));
    }
  };

  // ── Modal config ──────────────────────────────────────────────────────────
  const modalConfig: Record<keyof DocumentState, { title: string; description: string; multiple?: boolean }> = {
    vehiclePhotos: {
      title: 'Photographs of Vehicle',
      description: 'Upload clear photos of the front, rear, and sides of your vehicle.',
      multiple: true,
    },
    identityCard: {
      title: 'Identity Card / Passport',
      description: 'Upload a clear scan or photo of your IC or passport (all pages with personal info).',
    },
    employmentPass: {
      title: 'Employment / Immigration Pass Card',
      description: 'Upload your valid employment pass, EP, S Pass, or equivalent immigration card.',
    },
    vehicleRegistration: {
      title: 'Vehicle Registration Certificate',
      description: 'Upload your official vehicle registration certificate (log card).',
    },
    roadTax: {
      title: 'Vehicle Road Tax Disc / Digital Road Tax',
      description: 'Upload your road tax disc or a screenshot of your digital road tax.',
    },
    insurance: {
      title: 'Certificate of Insurance',
      description: 'Upload your current motor insurance certificate showing coverage dates.',
    },
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!declarationChecked) {
      setError('Please check the declaration checkbox to confirm you understand the terms.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await apiService.Application.create({
        plate_no: vehicleData.plateNo,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        vin: vehicleData.vin,
        insurance_expiry: vehicleData.insuranceExpiry
      });

      await apiService.Application.submit(result.application.id);

      alert('Application submitted successfully!');
      navigate('/driver/vehicles');
    } catch (err: any) {
      if (err.response?.data?.error?.includes('duplicate') ||
          err.response?.data?.error?.includes('already exists') ||
          err.message?.includes('duplicate key value violates unique constraint')) {
        setError(`A vehicle with plate number "${vehicleData.plateNo}" already exists. Please use a different plate number or contact support if you believe this is an error.`);
      } else {
        setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Vehicle Info' },
    { num: 2, title: 'Upload Documents' },
    { num: 3, title: 'Review' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Upload Modal */}
      {activeModal && (
        <UploadModal
          {...modalConfig[activeModal]}
          existing={docs[activeModal]}
          onClose={() => setActiveModal(null)}
          onUpload={(files) => handleUpload(activeModal, files)}
        />
      )}

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
          {steps.map(s => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                step >= s.num ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > s.num ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${
                step >= s.num ? 'text-emerald-700' : 'text-slate-400'
              }`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">

          {/* ── Step 1: Vehicle Info ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Vehicle Information</h2>
                <p className="text-slate-500 mt-1">Provide the registration info exactly as it appears on your log card.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Email — full width */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.email}
                    onChange={(e) => setVehicleData({ ...vehicleData, email: e.target.value })}
                  />
                  <p className="text-xs text-slate-400">Permit updates and notifications will be sent here.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Plate Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. JRS 1234"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.plateNo}
                    onChange={(e) => setVehicleData({ ...vehicleData, plateNo: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Registration Year <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="2024"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({ ...vehicleData, year: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Make (Manufacturer) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Proton"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Model <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. X50"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">VIN / Chassis Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="17-character VIN (e.g. 1HGCM82633A123456)"
                    maxLength={17}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    value={vehicleData.vin}
                    onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-slate-400">Must be exactly 17 characters</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Insurance Expiry Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    min={todayStr}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={vehicleData.insuranceExpiry}
                    onChange={(e) => setVehicleData({ ...vehicleData, insuranceExpiry: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Upload Documents ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Upload Documents</h2>
                <p className="text-slate-500 mt-1">
                  Clear scans or photos required. Fields marked <span className="text-red-500 font-semibold">*</span> are mandatory.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              <div className="space-y-3">
                <DocRow
                  label="Photographs of Vehicle"
                  required
                  uploaded={docs.vehiclePhotos}
                  onOpen={() => setActiveModal('vehiclePhotos')}
                />
                <DocRow
                  label="Identity Card / Passport"
                  required
                  uploaded={docs.identityCard}
                  onOpen={() => setActiveModal('identityCard')}
                />
                <DocRow
                  label="Employment / Immigration Pass Card"
                  required
                  uploaded={docs.employmentPass}
                  onOpen={() => setActiveModal('employmentPass')}
                />
                <DocRow
                  label="Vehicle Registration Certificate"
                  required
                  uploaded={docs.vehicleRegistration}
                  onOpen={() => setActiveModal('vehicleRegistration')}
                />
                <DocRow
                  label="Vehicle Road Tax Disc / Digital Road Tax"
                  optional
                  uploaded={docs.roadTax}
                  onOpen={() => setActiveModal('roadTax')}
                />
                <DocRow
                  label="Vehicle Certificate of Insurance"
                  required
                  uploaded={docs.insurance}
                  onOpen={() => setActiveModal('insurance')}
                />
              </div>

              <p className="text-xs text-slate-400">
                <span className="text-red-400">*</span> Required documents. Your application cannot be processed without these.
              </p>
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Review</h2>
                <p className="text-slate-500 mt-1">Please review your application details before submitting.</p>
              </div>

              {/* Vehicle Summary */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Vehicle Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Plate No</p>
                    <p className="font-bold text-slate-900">{vehicleData.plateNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Year</p>
                    <p className="font-bold text-slate-900">{vehicleData.year}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Make</p>
                    <p className="font-bold text-slate-900">{vehicleData.make}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold">Model</p>
                    <p className="font-bold text-slate-900">{vehicleData.model}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs uppercase font-bold">Email</p>
                    <p className="font-bold text-slate-900">{vehicleData.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs uppercase font-bold">VIN</p>
                    <p className="font-mono font-bold text-slate-900">{vehicleData.vin}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs uppercase font-bold">Insurance Expiry</p>
                    <p className={`font-bold ${new Date(vehicleData.insuranceExpiry) < new Date() ? 'text-red-600' : 'text-emerald-600'}`}>
                      {vehicleData.insuranceExpiry ? new Date(vehicleData.insuranceExpiry).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Summary */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Documents Uploaded</p>
                <div className="space-y-2">
                  {/* Vehicle Photos */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Photographs of Vehicle</p>
                      <div className="text-xs text-slate-500 mt-1 space-y-1">
                        {docs.vehiclePhotos.length > 0 ? (
                          docs.vehiclePhotos.map((photo, i) => (
                            <p key={i} className="truncate">• {photo.file.name}</p>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">No photos uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Identity Card */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      docs.identityCard ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <svg className={`w-3 h-3 ${docs.identityCard ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Identity Card / Passport</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {docs.identityCard ? `• ${docs.identityCard.file.name}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {/* Employment Pass */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      docs.employmentPass ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <svg className={`w-3 h-3 ${docs.employmentPass ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Employment / Immigration Pass</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {docs.employmentPass ? `• ${docs.employmentPass.file.name}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {/* Vehicle Registration */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      docs.vehicleRegistration ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <svg className={`w-3 h-3 ${docs.vehicleRegistration ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Vehicle Registration Certificate</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {docs.vehicleRegistration ? `• ${docs.vehicleRegistration.file.name}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {/* Road Tax */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      docs.roadTax ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <svg className={`w-3 h-3 ${docs.roadTax ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Road Tax Disc (Optional)</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {docs.roadTax ? `• ${docs.roadTax.file.name}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      docs.insurance ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}>
                      <svg className={`w-3 h-3 ${docs.insurance ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Certificate of Insurance</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {docs.insurance ? `• ${docs.insurance.file.name}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
                />
                <p className="text-xs text-slate-500 leading-relaxed">
                  I hereby declare that the information provided is true and correct. I understand that any false declarations may lead to permit revocation and legal action under Singapore law.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-8 bg-slate-50 border-t flex items-center justify-between">
          <button
            onClick={step === 1 ? () => navigate('/driver/vehicles') : prevStep}
            className="px-6 py-3 text-slate-600 font-bold hover:underline"
            disabled={submitting}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={submitting}
            className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : step === 3 ? 'Submit Application' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationWizard;