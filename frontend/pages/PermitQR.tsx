import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vehicle } from '../types';
import apiService from '@/api/api.service';
import { Link, useParams } from 'react-router-dom';

const PermitQR: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshSeed, setRefreshSeed] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await apiService.Vehicle.getById(Number(vehicleId));
        setVehicle(data);
      } catch (error) {
        console.error('Failed to load vehicle:', error);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) loadData();
  }, [vehicleId]);

  useEffect(() => {
    if (expiresAt === null) return;

    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setExpired(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 500);

    return () => clearInterval(timerRef.current!);
  }, [expiresAt]);

  const handleRefresh = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRefreshing(true);
    setRefreshSeed(Date.now());
    setExpiresAt(Date.now() + 15000);
    setTimeLeft(15);
    setExpired(false);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const qrPixels = useMemo(() => {
    return Array.from({ length: 400 }, () => Math.random() > 0.5);
  }, [refreshSeed]);

  const isInsuranceExpired = vehicle ? new Date(vehicle.insuranceExpiry) < new Date() : false;
  const hasGenerated = refreshSeed !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading permit...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Vehicle Not Found</h3>
          <p className="text-slate-500 mb-8">We couldn't load the vehicle details. Please go back and try again.</p>
          <Link
            to="/driver/vehicles"
            className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg"
          >
            Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center">

        {/* Header */}
        <div className={`p-6 ${isInsuranceExpired ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
          <h2 className="text-xl font-bold tracking-tight">
            {isInsuranceExpired ? 'Expired Permit' : 'Digital Border Pass'}
          </h2>
          <p className={`${isInsuranceExpired ? 'text-red-100' : 'text-emerald-100'} text-xs mt-1 uppercase tracking-widest font-medium opacity-80`}>
            Woodlands / Tuas Checkpoint
          </p>
        </div>

        <div className="p-10 space-y-8">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className={`p-4 bg-white border-8 border-slate-50 rounded-3xl shadow-inner transition-opacity duration-150
              ${isRefreshing ? 'opacity-15' : 'opacity-100'}
              ${isInsuranceExpired || !hasGenerated || expired ? 'grayscale' : ''}`}
            >
              <div className="w-56 h-56 bg-slate-900 rounded-2xl p-4 flex flex-wrap items-start justify-start overflow-hidden opacity-95 relative">
                {qrPixels.map((isWhite, i) => (
                  <div
                    key={i}
                    className={`w-1 h-1 ${
                      hasGenerated && !expired
                        ? isWhite ? 'bg-white' : 'bg-slate-900'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14
                  ${isInsuranceExpired ? 'bg-red-500' : expired ? 'bg-slate-500' : !hasGenerated ? 'bg-slate-600' : 'bg-emerald-500'}
                  rounded-xl border-4 border-white flex items-center justify-center shadow-lg`}
                >
                  {isInsuranceExpired ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : expired || !hasGenerated ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Timer / Status */}
            <div className="mt-6 w-full max-w-[224px]">
              {!hasGenerated ? (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Press generate to activate QR
                </p>
              ) : expired ? (
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center animate-pulse">
                  Token expired — refresh to regenerate
                </p>
              ) : (
                <>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <span>Token valid for</span>
                    <span className={timeLeft <= 10 ? 'text-red-500' : 'text-emerald-600'}>{timeLeft}s</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-linear ${timeLeft <= 10 ? 'bg-red-400' : 'bg-emerald-500'}`}
                      style={{ width: `${(timeLeft / 15) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vehicle Plate</p>
              <p className="text-lg font-black text-slate-900">{vehicle.plateNo}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Insurance Expiry</p>
              <p className={`text-lg font-black ${isInsuranceExpired ? 'text-red-600' : 'text-slate-900'}`}>
                {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-left">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Make</p>
              <p className="text-sm font-bold text-slate-700">{vehicle.make}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-left">
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Model</p>
              <p className="text-sm font-bold text-slate-700">{vehicle.model}</p>
            </div>
          </div>

          {isInsuranceExpired && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-bold text-red-600">⚠️ Insurance has expired. Please renew before crossing.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 border-t flex flex-col gap-3">
          {!isInsuranceExpired && (
            <button
              onClick={handleRefresh}
              className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95
                ${expired || !hasGenerated
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {!hasGenerated ? 'Generate QR' : expired ? 'Regenerate QR' : 'Refresh Token'}
            </button>
          )}
          <Link
            to="/driver/vehicles"
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors text-center"
          >
            {isInsuranceExpired ? 'Back to Vehicles' : 'Close Pass'}
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-[10px] text-slate-400 leading-relaxed px-8 font-medium uppercase tracking-widest">
        {isInsuranceExpired
          ? 'Insurance expired. Please renew before crossing the border.'
          : 'This QR code is encrypted and single-use. Do not share screen captures.'}
      </p>
    </div>
  );
};

export default PermitQR;