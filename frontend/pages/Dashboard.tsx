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
      {/* Stats */}
      {/* <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map(stat => (
            <div key={stat.label} className={`p-4 rounded-xl ${stat.cardClass}`}>
              <p className={`${stat.labelClass} text-sm font-semibold uppercase tracking-wider`}>{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.valueClass}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section> */}

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
          {/* <button
            onClick={() => navigate('/driver/new-application')}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
          >
            + New Application
          </button> */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Submitted At</th>
                <th className="px-6 py-4 font-semibold">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {/* ← use nested vehicle directly from app */}
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
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {app.expiryDate ? new Date(app.expiryDate).toLocaleDateString() : 'N/A'}
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