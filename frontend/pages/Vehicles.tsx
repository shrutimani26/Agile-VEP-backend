import React, { useState, useEffect } from 'react';
import { Application, Vehicle } from '../types';
import apiService from '@/api/api.service';
import { Link, useNavigate } from 'react-router-dom';

// ─── Details Modal ────────────────────────────────────────────────────────────
interface DetailsModalProps {
  application: Application;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ application, onClose }) => {
  const v = application.vehicle!;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Vehicle Details</h2>
            <p className="text-emerald-100 text-xs mt-0.5 uppercase tracking-widest">Permit #{application.id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Owner Details */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Owner Information</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                <span className="text-sm font-bold text-slate-900">Ahmad bin Abdullah</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                <span className="text-sm font-bold text-slate-900">15 March 1990</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IC Number</span>
                <span className="text-sm font-mono font-bold text-slate-900">SXXXX567I</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                <span className="text-sm font-bold text-slate-900">+65 12341234</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                <span className="text-sm font-bold text-slate-900">ahmad@example.com</span>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vehicle Information</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plate No</span>
                <span className="text-sm font-black text-slate-900 tracking-wider">{v.plateNo}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Make</span>
                <span className="text-sm font-bold text-slate-900">{v.make}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model</span>
                <span className="text-sm font-bold text-slate-900">{v.model}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year</span>
                <span className="text-sm font-bold text-slate-900">{v.year}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">VIN / Chassis</span>
                <span className="text-sm font-mono font-bold text-slate-900">{v.vin}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance Expiry</span>
                <span className={`text-sm font-bold ${new Date(v.insuranceExpiry) < new Date() ? 'text-red-600' : 'text-emerald-600'}`}>
                  {new Date(v.insuranceExpiry).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Application Information</p>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <span className={`text-xs font-black px-2 py-1 rounded uppercase ${
                  application.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  application.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {application.status}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted At</span>
                <span className="text-sm font-bold text-slate-900">
                  {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '—'}
                </span>
              </div>
              {application.decisionReason && (
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</span>
                  <span className="text-sm font-bold text-slate-900">{application.decisionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Vehicles Page ───────────────────────────────────────────────────────
const Vehicles: React.FC = () => {
  const [vehiclesApplication, setVehiclesApplication] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const navigate = useNavigate();

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.Application.getAll();
      console.log(data);
      setVehiclesApplication(data);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':       return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED':       return 'bg-red-100 text-red-700';
      case 'SUBMITTED':      return 'bg-blue-100 text-blue-700';
      case 'PENDING REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'DRAFT':          return 'bg-slate-100 text-slate-600';
      case 'EXPIRED':        return 'bg-orange-100 text-orange-700';
      default:               return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'SUBMITTED':      return 'Your application has been submitted and is awaiting review.';
      case 'PENDING REVIEW': return 'Your application is currently being reviewed by an officer.';
      case 'REJECTED':       return 'Your application was rejected. Please start a new application.';
      case 'DRAFT':          return 'Your application is incomplete.';
      case 'EXPIRED':        return 'Your permit has expired. Please renew your application.';
      default:               return '';
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading vehicles...</div>;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">My Vehicles</h2>
          <p className="text-slate-500">Manage Malaysian-registered vehicles linked to your profile.</p>
        </div>
        <Link to="/driver/new-application">
          <div className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Application
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {vehiclesApplication.length === 0 ? (
          <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No applications found.</p>
            <button onClick={() => navigate('/driver/new-application')} className="mt-4 text-emerald-600 font-bold hover:underline">
              Start your first application
            </button>
          </div>
        ) : (
          vehiclesApplication.map(application => {
            const v = application.vehicle;
            if (!v) return null;

            const isApproved = application.status === 'APPROVED';
            const isRejected = application.status === 'REJECTED';
            const isInsuranceExpired = new Date(v.insuranceExpiry) < new Date();
            const isExpiringSoon = !isInsuranceExpired && new Date(v.insuranceExpiry) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

            return (
              <div key={application.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative group overflow-hidden">

                {/* Top Badge */}
                <div className="absolute top-0 right-0 p-4 flex gap-1">
                  {isApproved ? (
                    isInsuranceExpired ? (
                      <span className="text-[10px] font-black px-2 py-1 bg-red-100 text-red-500 rounded uppercase">EXPIRED</span>
                    ) : (
                      <>
                        <span className="text-[10px] font-black px-2 py-1 bg-emerald-100 text-emerald-500 rounded uppercase">ACTIVE</span>
                        {isExpiringSoon && (
                          <span className="text-[10px] font-black px-2 py-1 bg-orange-100 text-orange-500 rounded uppercase">Expiring Soon</span>
                        )}
                      </>
                    )
                  ) : (
                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${getStatusStyle(application.status)}`}>
                      {application.status}
                    </span>
                  )}
                </div>

                {/* Vehicle Header */}
                <div className="flex items-start mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{v.plateNo}</h3>
                    <p className="text-slate-500 font-medium">{v.make} {v.model} ({v.year})</p>
                  </div>
                </div>

                {/* Approved: insurance details + buttons */}
                {isApproved ? (
                  <>
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insurance Expiry</span>
                        <span className={`text-sm font-black ${isInsuranceExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                          {new Date(v.insuranceExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate(`/driver/permit/${v.id}`)}
                        disabled={isInsuranceExpired}
                        className={`col-span-2 py-3 rounded-xl text-sm font-bold transition-colors ${
                          isInsuranceExpired
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        Generate QR
                      </button>
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate('/driver/new-application')}
                        className="py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                      >
                        Renew
                      </button>
                    </div>
                  </>
                ) : (
                  /* Not approved: status message + buttons */
                  <div className="pt-6 border-t border-slate-50 space-y-3">
                    <div className={`p-4 rounded-xl text-sm font-medium ${getStatusStyle(application.status)}`}>
                      <span className="font-black uppercase text-xs tracking-widest block mb-1">{application.status}</span>
                      <p className="opacity-80">{getStatusMessage(application.status)}</p>
                    </div>

                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                    >
                      View Details
                    </button>

                    {isRejected && (
                      <button
                        onClick={() => navigate('/driver/new-application')}
                        className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                      >
                        + New Application
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {selectedApplication && (
        <DetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
};

export default Vehicles;