import React, { useState, useEffect } from 'react';
import { Crossing, CrossingDirection, CrossingResult } from '../types';
import apiService from '@/api/api.service';
import { useAuth } from '@/Auth/useAuth';

const CrossingHistory: React.FC = () => {
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadCrossings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.Crossing.getUserCrossings(30);
        const fakeRecords = JSON.parse(sessionStorage.getItem('fakeRecords') || '[]');
        setCrossings([...fakeRecords, ...data].sort(
          (a: Crossing, b: Crossing) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      } catch (err: any) {
        console.error('Failed to load crossings:', err);
        setError('Failed to load crossing history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadCrossings();
  }, []);

  //beep sound for testing!

  const playBeep = () => {
  const audioCtx = new AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1480, audioCtx.currentTime); 
  gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15); 

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.15); 
};

  const generateFakeRecords = (): Crossing[] => {
    const entryRecord: Crossing = {
      id: `fake-entry-${Date.now()}`,
      permitId: 'fake-permit-001',
      vehicleId: 'SGX1234A',
      userId: String(user?.id ?? 'fake-user'),
      direction: CrossingDirection.ENTRY,
      checkpoint: 'Woodlands Checkpoint',
      timestamp: new Date().toISOString(),
      result: CrossingResult.SUCCESS,
    };

    return [entryRecord];
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        playBeep();
        const newRecords = generateFakeRecords();
        const existing = JSON.parse(sessionStorage.getItem('fakeRecords') || '[]');
        const updated = [...newRecords, ...existing];
        sessionStorage.setItem('fakeRecords', JSON.stringify(updated));
        setCrossings(prev =>
          [...newRecords, ...prev].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  const lastEntry = crossings.find(c => c.direction === CrossingDirection.ENTRY);
  const lastExit = crossings.find(c => c.direction === CrossingDirection.EXIT);

  const inSingapore = lastEntry && (!lastExit || new Date(lastEntry.timestamp) > new Date(lastExit.timestamp));

  if (loading) return <div className="p-8 text-center text-slate-500">Loading trip history...</div>;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Trip Management</h2>
          <p className="text-slate-500">View and manage your recent SG entries and exits.</p>
        </div>
      </div>

      {/* Current Status Card */}
      <div className={`p-8 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between border-2 ${inSingapore ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Current Location Status</p>
          <div className="flex items-center justify-center md:justify-start">
            <div className={`w-3 h-3 rounded-full mr-3 animate-pulse ${inSingapore ? 'bg-white' : 'bg-slate-500'}`}></div>
            <h3 className="text-2xl font-black">{inSingapore ? 'Currently in Singapore' : 'Outside Singapore'}</h3>
          </div>
        </div>
      </div>

      {/* Crossing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Logs</h3>
          <button className="text-emerald-600 text-xs font-bold hover:underline">Download Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Checkpoint</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crossings.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${c.direction === CrossingDirection.ENTRY ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={c.direction === CrossingDirection.ENTRY ? 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' : 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'} />
                        </svg>
                      </div>
                      <span className="font-bold text-slate-800">{c.direction}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.checkpoint}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.vehicleId}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(c.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase">DIGITAL-SCAN</span>
                  </td>
                </tr>
              ))}
              {crossings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No trip records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CrossingHistory;