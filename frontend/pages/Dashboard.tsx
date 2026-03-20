import React, { useState, useEffect } from 'react';
import { Application, ApplicationStatus } from '../types';
import { useAuth } from '@/Auth/useAuth';
import apiService from '@/api/api.service';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setActiveTab('dashboard');
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const userApps = await apiService.Application.getAll();
        setApps(userApps ?? []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const stats = [
    { label: 'Active Permits', value: apps.filter(a => a.status === ApplicationStatus.APPROVED).length, cardClass: 'border-2 border-emerald-100 bg-emerald-50', labelClass: 'text-emerald-700', valueClass: 'text-emerald-900' },
    { label: 'Pending', value: apps.filter(a => a.status === ApplicationStatus.PENDING_REVIEW || a.status === ApplicationStatus.SUBMITTED).length, cardClass: 'border-2 border-amber-100 bg-amber-50', labelClass: 'text-amber-700', valueClass: 'text-amber-900' },
    { label: 'Vehicles', value: apps.filter(a => a.vehicle).length, cardClass: 'border-2 border-blue-100 bg-blue-50', labelClass: 'text-blue-700', valueClass: 'text-blue-900' },
  ];

  // Helper function to get application date (using submittedAt or createdAt)
  const getApplicationDate = (app: Application): string => {
    const date = app.submittedAt || app.createdAt;
    return date ? new Date(date).toLocaleDateString() : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Applications</h2>
            <p className="text-slate-500">An overview of your vehicle applications at a glance.</p>
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
      
      {/* Application Status */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Current Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date of Application</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{app.vehicle?.plateNo || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{app.vehicle?.make} {app.vehicle?.model}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      app.status === ApplicationStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                      app.status === ApplicationStatus.REJECTED ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {getApplicationDate(app)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/driver/applications/${app.id}`)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No current applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;