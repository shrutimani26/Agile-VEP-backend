import React, { useState, useEffect } from 'react';
import { useAuth } from '@/Auth/useAuth';
import apiService from '@/api/api.service';
import { Application, ApplicationStatus } from '@/types';

const OfficerQueue: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check officer access
  if (user?.role !== 'OFFICER') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">Officer access required to view this page.</p>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all applications (already includes user and vehicle data!)
      const result = await apiService.Application.getAllApplications();
      const allApps = result.applications || [];

      // Filter for pending/submitted applications
      const pending = allApps.filter(
        (a: Application) =>
          a.status === ApplicationStatus.PENDING_REVIEW ||
          a.status === ApplicationStatus.SUBMITTED
      );

      console.log("Loaded applications for review:", pending);
      setApps(pending);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (status: ApplicationStatus) => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      setError(null);

      // Review application via API
      await apiService.Application.review(
        parseInt(selectedApp.id),
        status === ApplicationStatus.APPROVED,
        reason || (status === ApplicationStatus.APPROVED ? 'Verified and approved' : undefined)
      );

      await loadData();

      // Reset state
      setSelectedApp(null);
      setReason('');

      alert(`Application ${status === ApplicationStatus.APPROVED ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Review failed:', err);
      setError('Failed to review application. Please try again.');
      alert('Failed to review application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error && apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Application Queue</h2>
          <p className="text-slate-500">Review and verify Malaysian vehicle permit requests.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold">
          {apps.length} Pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="p-4 border-b bg-slate-50 rounded-t-2xl font-bold text-sm text-slate-500 uppercase tracking-widest">
            Pending Tasks
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`w-full p-6 text-left hover:bg-slate-50 transition-colors ${selectedApp?.id === app.id ? 'bg-emerald-50 border-r-4 border-emerald-500' : ''
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-900">
                    {app.vehicle?.plateNo || 'App #' + app.id.slice(-4)}
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mb-1">
                  {app.user?.name || 'Unknown User'}
                </p>
                <p className="text-[10px] text-slate-400 mb-2 uppercase">
                  SUBMITTED: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                </p>
                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Ready for review
                </div>
              </button>
            ))}
            {apps.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
              {/* Check if application has required data */}
              {!selectedApp.user || !selectedApp.vehicle ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2v-2m0-4V9m0 0V7m0 2V9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Incomplete Application Data</h3>
                  <p className="text-slate-600 mb-4">
                    {!selectedApp.user
                      ? "This application is missing driver information. The driver may have deleted their account or the data is corrupted."
                      : "This application is missing vehicle information. Please contact the driver to provide the required vehicle details."}
                  </p>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                  >
                    Back to Queue
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-slate-900">Application Review</h3>
                      <p className="text-sm text-slate-500">
                        Applicant:{' '}
                        <span className="font-bold text-slate-700">
                          {selectedApp.user?.name || 'Unknown'}
                        </span>
                      </p>
                      {selectedApp.user?.email && (
                        <p className="text-xs text-slate-400">{selectedApp.user.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plate No</p>
                      <p className="text-xl font-black text-emerald-600">
                        {selectedApp.vehicle?.plateNo || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Vehicle Details */}
                    {selectedApp.vehicle && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Make</p>
                          <p className="text-sm font-bold">{selectedApp.vehicle.make}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Model</p>
                          <p className="text-sm font-bold">{selectedApp.vehicle.model}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Year</p>
                          <p className="text-sm font-bold">{selectedApp.vehicle.year}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Insurance Exp</p>
                          <p className="text-sm font-bold text-emerald-600">
                            {selectedApp.vehicle.insuranceExpiry}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User Contact Info */}
                    {selectedApp.user && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                          <p className="text-sm font-bold">{selectedApp.user.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                          <p className="text-sm font-bold">{selectedApp.user.phone || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {/* Documents Grid */}
                    <div>
                      <h4 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">
                        Supporting Documents
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedApp.documents && selectedApp.documents.length > 0 ? (
                          selectedApp.documents.map(doc => (
                            <div
                              key={doc.id}
                              className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm"
                            >
                              <div className="flex items-center">
                                <svg
                                  className="w-6 h-6 text-slate-400 mr-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <div>
                                  <span className="text-xs font-bold text-slate-700 uppercase block">
                                    {doc.type}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{doc.name}</span>
                                </div>
                              </div>
                              <button className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline px-2 py-1 bg-emerald-50 rounded">
                                VIEW
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                            <svg
                              className="w-8 h-8 mx-auto mb-2 opacity-20"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            No documents uploaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Status</p>
                      <p
                        className={`text-sm font-bold ${selectedApp.paymentStatus === 'PAID'
                          ? 'text-emerald-600'
                          : selectedApp.paymentStatus === 'FAILED'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                          }`}
                      >
                        {selectedApp.paymentStatus}
                      </p>
                    </div>

                    {/* Audit Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold uppercase text-slate-400 tracking-widest">
                        Internal Remarks / Reason for Decision
                      </label>
                      <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
                        placeholder="Provide details if rejecting, or enter 'Verified' for approval..."
                        disabled={submitting}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => handleDecision(ApplicationStatus.APPROVED)}
                        disabled={submitting}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : 'Approve Application'}
                      </button>
                      <button
                        onClick={() => handleDecision(ApplicationStatus.REJECTED)}
                        disabled={submitting || !reason.trim()}
                        className="flex-1 py-4 bg-white border-2 border-rose-500 text-rose-500 rounded-xl font-bold hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : 'Reject with Reason'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-[400px] flex flex-col items-center justify-center text-slate-400">
              <svg
                className="w-16 h-16 mb-4 opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <p className="font-medium uppercase tracking-widest text-xs">
                Select an application from the queue to review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerQueue;
