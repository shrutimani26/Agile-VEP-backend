
import React, { useState } from 'react';
import { DBService } from '../services/db';
import { ApplicationStatus, CrossingDirection } from '../types';

const OfficerScan: React.FC = () => {
  const [token, setToken] = useState('');
  const [direction, setDirection] = useState<CrossingDirection>(CrossingDirection.ENTRY);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handleVerify = async () => {
    const inputToken = token.trim();
    const prefix = 'PERMIT-';
    
    // Basic format check
    if (!inputToken.toUpperCase().startsWith(prefix)) {
      setResult({ success: false, message: 'Invalid token format. Must start with PERMIT-' });
      return;
    }

    const allApps = await DBService.getApplications();
    // Get everything after "PERMIT-"
    const content = inputToken.slice(prefix.length);
    const parts = content.split('-');
    
    let app = null;

    /**
     * Strategy: Match the longest possible segment from the token.
     * If user enters PERMIT-app-1-174051000, it tries:
     * 1. "app-1-174051000"
     * 2. "app-1" (Match found!)
     */
    for (let i = parts.length; i > 0; i--) {
      const candidateId = parts.slice(0, i).join('-');
      const found = allApps.find(a => a.id.toLowerCase() === candidateId.toLowerCase());
      if (found) {
        app = found;
        break;
      }
    }

    if (!app) {
      setResult({ success: false, message: `Permit not found. Please check the ID.` });
    } else if (app.status !== ApplicationStatus.APPROVED) {
      setResult({ success: false, message: `Permit is ${app.status}. Clearance denied.` });
    } else {
      // Log the crossing with selected direction
      await DBService.logCrossing({
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        permitId: app.id,
        vehicleId: app.vehicleId,
        userId: app.userId,
        direction: direction,
        checkpoint: 'Woodlands',
        timestamp: new Date().toISOString(),
        result: 'SUCCESS'
      });

      setResult({ 
        success: true, 
        message: `${direction === CrossingDirection.ENTRY ? 'Entry' : 'Exit'} Authorized!`, 
        data: { 
          vehicleId: app.vehicleId, 
          driver: app.userId,
          validUntil: app.expiryDate,
          direction: direction
        } 
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 font-mono tracking-tighter">OFFICER SCANNER</h2>
        <p className="text-slate-500">Checkpoint Entry/Exit Verification</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Direction Toggle */}
        <div className="bg-slate-50 p-4 flex justify-center border-b">
          <div className="bg-slate-200 p-1 rounded-xl flex w-full max-w-[300px]">
            <button 
              onClick={() => setDirection(CrossingDirection.ENTRY)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${direction === CrossingDirection.ENTRY ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}
            >
              Entry Log
            </button>
            <button 
              onClick={() => setDirection(CrossingDirection.EXIT)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${direction === CrossingDirection.EXIT ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500'}`}
            >
              Exit Log
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 text-center">
          <div className="w-full aspect-square max-w-[280px] mx-auto bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center group cursor-pointer border-4 border-slate-800 shadow-2xl">
            <div className={`absolute inset-0 opacity-10 animate-pulse ${direction === CrossingDirection.ENTRY ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            <div className="relative text-white z-10 flex flex-col items-center">
              <svg className={`w-16 h-16 mb-4 ${direction === CrossingDirection.ENTRY ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className={`font-mono text-sm uppercase tracking-widest ${direction === CrossingDirection.ENTRY ? 'text-emerald-400' : 'text-amber-400'}`}>
                {direction} SENSOR READY
              </p>
            </div>
            {/* Scanning line animation */}
            <div className={`absolute top-0 left-0 w-full h-1 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_3s_ease-in-out_infinite] ${direction === CrossingDirection.ENTRY ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          </div>

          <style>{`
            @keyframes scan {
              0%, 100% { top: 0%; }
              50% { top: 100%; }
            }
          `}</style>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Scan or Paste Token..."
                className="w-full pl-6 pr-32 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 outline-none transition-all font-mono text-lg"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button 
                onClick={handleVerify}
                className="absolute right-2 top-2 bottom-2 px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                VERIFY
              </button>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Simulated Driver</span>
               <button 
                 onClick={() => { setToken('PERMIT-app-1'); handleVerify(); }}
                 className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
               >
                 Test: Ahmad Ismail (JRS 2024)
               </button>
            </div>
          </div>

          {result && (
            <div className={`p-8 rounded-3xl animate-fadeIn shadow-2xl ${result.success ? 'bg-emerald-600 text-white' : 'bg-rose-50 border-2 border-rose-500 text-rose-900'}`}>
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.success ? 'bg-white/20' : 'bg-rose-100 text-rose-600'}`}>
                  {result.success ? (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              <h4 className="text-3xl font-black mb-2 tracking-tight">
                {result.message}
              </h4>
              {result.success && result.data && (
                <div className="mt-6 pt-6 border-t border-white/20 space-y-3 text-left font-medium">
                  <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl">
                    <span className="text-xs opacity-70 uppercase font-bold">Vehicle ID</span> 
                    <span className="font-mono text-lg">{result.data.vehicleId}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl">
                    <span className="text-xs opacity-70 uppercase font-bold">Direction</span> 
                    <span className="font-bold uppercase tracking-widest">{result.data.direction}</span>
                  </div>
                </div>
              )}
              <button 
                onClick={() => { setResult(null); setToken(''); }}
                className={`mt-8 w-full py-4 rounded-xl font-bold transition-colors ${result.success ? 'bg-white text-emerald-700 hover:bg-emerald-50' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
              >
                {result.success ? 'NEXT CLEARANCE' : 'RETRY SCAN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerScan;
