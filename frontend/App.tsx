import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import ApplicationWizard from "./pages/ApplicationWizard";
import PermitQR from "./pages/PermitQR";
import CrossingHistory from "./pages/CrossingHistory";
import OfficerQueue from "./pages/OfficerQueue";
import OfficerScan from "./pages/OfficerScan";
import Notifications from "./pages/Notifications";

import { UserRole } from "./types";
import RequireRole from "./components/RequireRole";
import { useAuth } from "./Auth/useAuth";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("vehicles");

  return (
    <Layout
      user={user}
      onLogout={logout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login/driver"
          element={<Login role={UserRole.DRIVER} />}
        />
        <Route
          path="/login/officer"
          element={<Login role={UserRole.OFFICER} />}
        />
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Protected Driver Routes */}
        <Route
          path="/driver/payment"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <Payment />
            </RequireRole>
          }
        />
        <Route
          path="/driver/vehicles"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <Vehicles />
            </RequireRole>
          }
        />
        <Route
          path="/driver/dashboard"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <Dashboard setActiveTab={setActiveTab} />
            </RequireRole>
          }
        />
        <Route
          path="/driver/history"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <CrossingHistory />
            </RequireRole>
          }
        />
        <Route
          path="/driver/notifications"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <Notifications />
            </RequireRole>
          }
        />
        <Route
          path="/driver/new-application"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <ApplicationWizard />
            </RequireRole>
          }
        />
        <Route
          path="/driver/permit/:vehicleId"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <PermitQR />
            </RequireRole>
          }
        />
        <Route
          path="/driver/profile"
          element={
            <RequireRole role={UserRole.DRIVER}>
              <Profile setActiveTab={setActiveTab} />
            </RequireRole>
          }
        />
        {/* Protected Officer Routes */}
        <Route
          path="/officer/queue"
          element={
            <RequireRole role={UserRole.OFFICER}>
              <OfficerQueue />
            </RequireRole>
          }
        />
        <Route
          path="/officer/scan"
          element={
            <RequireRole role={UserRole.OFFICER}>
              <OfficerScan />
            </RequireRole>
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

export default App;