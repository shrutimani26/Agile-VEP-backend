import React, { useState, useEffect } from 'react';
import { useAuth } from '@/Auth/useAuth';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const Profile: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    nric_passport: '',
    passport: 'A12345678',       // hardcoded — not in backend model yet
    date_of_birth: '1992-07-12', // hardcoded — not in backend model yet
    citizenship: 'Malaysian',    // hardcoded — not in backend model yet
  });

  useEffect(() => {
    setActiveTab('profile');
    if (user) {
      setFormData(prev => ({
        ...prev,
        // Mapped from backend to_dict(): name, phone, email, maskedId
        full_name: user.name || '',
        phone_number: user.phone || '',
        email: user.email || '',
        nric_passport: user.maskedId || '',
      }));
    }
  }, [user]);

  const handleSave = () => {
    console.log('Updated profile data:', formData);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
              My <span className="text-emerald-400">Profile</span>
            </h2>
            <p className="text-slate-400 text-sm mt-2">Manage your personal information.</p>
          </div>
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid gap-6">

            {/* Full Name — read-only */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">{formData.full_name}</p>
            </div>

            {/* Email & Phone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">{formData.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">{formData.phone_number}</p>
                )}
              </div>
            </div>

            {/* DOB & Citizenship — hardcoded, always read-only */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                  12 July 1992
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizenship</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase rounded-full">
                    Malaysian
                  </span>
                </div>
              </div>
            </div>

            {/* ID Card (MyKad) & Passport — split from single nric_passport field */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Card</label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. 920712-14-1234"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={formData.nric_passport}
                    onChange={e => setFormData({ ...formData, nric_passport: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                    {formData.nric_passport || '—'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passport Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. A12345678"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    value={formData.passport}
                    onChange={e => setFormData({ ...formData, passport: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                    {formData.passport || '—'}
                  </p>
                )}
              </div>
            </div>


          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-6">
            <div className="flex gap-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-4 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                  >
                    Save
                  </button>
                </>
              )}
            </div>

            <button
              onClick={logout}
              className="w-full py-4 bg-rose-50 text-rose-600 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 mt-4"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;