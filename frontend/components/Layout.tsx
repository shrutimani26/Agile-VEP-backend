
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getRouteFromTabId = (tabId: string, userRole?: UserRole): string => {
    if (userRole === UserRole.OFFICER) {
      const officerRoutes: Record<string, string> = {
        'queue': '/officer/queue',
        'scan': '/officer/scan',
      };
      return officerRoutes[tabId] || '/';
    }
    const driverRoutes: Record<string, string> = {
      'vehicles': '/driver/vehicles',
      'dashboard': '/driver/dashboard',
      'history': '/driver/history',
      'notifications': '/driver/notifications',
      'payment': '/driver/payment',
    };
    return driverRoutes[tabId] || '/';
  };

  const driverTabs = [
    { id: 'dashboard', name: 'Applications', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'vehicles', name: 'My Vehicles', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z' },
    { id: 'history', name: 'Travel Records', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'payment', name: 'Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'notifications', name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  ];

  const officerTabs = [
    { id: 'queue', name: 'Review Queue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'scan', name: 'Permit Scanner', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  ];

  const currentTabs = user?.role === UserRole.OFFICER ? officerTabs : driverTabs;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {user && (
        <aside className={`md:w-64 bg-slate-900 text-white flex-shrink-0 z-50 fixed md:relative inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition duration-200 ease-in-out shadow-2xl md:shadow-none`}>
          <div className="flex flex-col h-full">
            <div className="p-8">
              <h1 className="text-2xl font-black text-emerald-400 tracking-tighter italic">AUTO <span className="text-white">QRPASS</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Digital, Seamless Access</p>
            </div>
            
            <nav className="flex-1 mt-6 px-4 space-y-2">
              {currentTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { 
                    setActiveTab(tab.id); 
                    setIsMenuOpen(false);
                    navigate(getRouteFromTabId(tab.id, user?.role));
                  }}
                  className={`w-full flex items-center px-6 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span className="text-sm tracking-wide">{tab.name}</span>
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-800 space-y-4 m-4 rounded-3xl bg-slate-800/50 ">
  
              <div className="flex items-center" onClick={() => navigate('/driver/profile')}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white text-sm shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-xs font-bold truncate text-slate-100">{user.name}</p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
          
              
              <button 
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                className="w-full py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-700 hover:border-rose-500/20 text-[10px] font-black uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-auto relative flex flex-col min-h-screen">
        {user && (
          <header className="md:hidden bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
            <h2 className="font-black text-emerald-600 italic">VEP FP</h2>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-slate-600 bg-slate-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </header>
        )}

        <div className={`p-6 md:p-10 max-w-6xl mx-auto w-full animate-fadeIn ${!user ? 'h-full flex flex-col justify-center' : ''}`}>
          {children}
        </div>

        <footer className="py-12 px-8 text-center border-t border-slate-200/60 text-[10px] text-slate-400 mt-auto uppercase tracking-[0.3em] font-black">
          <div className="flex flex-col gap-3 items-center">
            <div className="w-8 h-1 bg-emerald-500 rounded-full mb-2"></div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
