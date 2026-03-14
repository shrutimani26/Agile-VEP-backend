
import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import apiService from '@/api/api.service';

const Notifications: React.FC= () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.Notification.getAll(false, 50);
        setNotifications(data.sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err: any) {
        console.error('Failed to load notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiService.Notification.markAsRead(notificationId);
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      alert('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.Notification.markAllAsRead();
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      alert('Failed to update notifications');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="p-8 text-center text-slate-500">Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900">Notifications</h2>
        <button 
          onClick={handleMarkAllAsRead}
          className="text-emerald-600 text-sm font-bold hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${n.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-emerald-100 shadow-md ring-1 ring-emerald-50'}`}
            onClick={() => !n.isRead && handleMarkAsRead(n.id)}
          >
            <div className="flex items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                n.type.includes('APPROVED') ? 'bg-emerald-100 text-emerald-600' : 
                n.type.includes('REJECTED') ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900">{n.title}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{n.body}</p>
                {!n.isRead && (
                  <div className="mt-4 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">New Update</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="font-medium">No alerts at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
