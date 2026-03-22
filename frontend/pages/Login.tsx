import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '@/Auth/useAuth';

interface LoginProps {
  role: UserRole;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ role }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');
  const { loginUser, user, logout } = useAuth()
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      if (user.role !== role) {
        logout()
        return;
      }
      const targetRoute = user.role === UserRole.DRIVER
        ? "/driver/vehicles"
        : "/officer/queue";
      navigate(targetRoute);
    }
  }, [user, navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const loggedInUser = await loginUser(email, password);

      if (loggedInUser.role !== role) {
        setError("Invalid role for this login portal");
        return;
      }
      console.log(loggedInUser)

      navigate(role === UserRole.DRIVER ? "/driver/vehicles" : "/officer/queue");
    } catch (error: any) {
      setError(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <Link to="/" className="text-emerald-600 flex items-center mb-6 hover:underline text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to start
        </Link>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {role === UserRole.DRIVER ? 'Driver Login' : 'Officer Login'}
        </h2>
        <p className="text-slate-500 mb-8 text-sm">
          Welcome back! Please enter your credentials to access the portal.
        </p>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-6 text-sm font-medium border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold mt-4 hover:bg-emerald-700 shadow-md">
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100">
          {role === UserRole.DRIVER && (
            <>
              <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold mb-4">Don't have an account?</p>
              <Link
                to="/register"
                className="w-full block py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-center hover:bg-slate-200 transition-all"
              >
                Create Driver Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
