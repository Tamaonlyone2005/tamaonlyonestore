
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StorageService } from './services/storageService';
import { User, SiteProfile } from './types';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Cart from './pages/Cart';
import OpenStore from './pages/OpenStore';
import Help from './pages/Help';
import { ToastProvider } from './components/Toast';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SiteProfile | null>(null);

  useEffect(() => {
    const initSession = async () => {
        let session = StorageService.getSession();
        
        // ADMIN ROLE FIX: Force fetch latest data from DB to ensure Role is updated
        if (session) {
            try {
                // Now findUser uses getDoc which is direct and fast
                const freshUser = await StorageService.findUser(session.id);
                if (freshUser) {
                    // Update Local Storage with fresh data
                    StorageService.setSession(freshUser);
                    session = freshUser;
                    console.log("Session Synced. Current Role:", freshUser.role);
                }
            } catch (e) {
                console.error("Failed to sync session with remote:", e);
            }
        }
        
        setUser(session);
        StorageService.getProfile().then(setProfile);
    };
    initSession();
  }, []);

  const refreshSession = () => {
    // Re-read from storage (which should be updated by login/logout)
    const session = StorageService.getSession();
    setUser(session);
  };

  // FEATURE 30: MAINTENANCE MODE
  if (profile?.isLocked && user?.role !== 'ADMIN') {
      return (
          <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
              <div className="max-w-md">
                  <AlertTriangle size={64} className="text-yellow-500 mx-auto mb-6 animate-bounce"/>
                  <h1 className="text-3xl font-bold text-white mb-4">Website Sedang Maintenance</h1>
                  <p className="text-gray-400">Kami sedang melakukan pembaruan sistem untuk meningkatkan layanan. Silakan kembali lagi nanti.</p>
              </div>
          </div>
      );
  }

  return (
    <ToastProvider>
      <Router>
        <Layout user={user} refreshSession={refreshSession}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop user={user} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={user ? <Navigate to="/shop" /> : <Login onLogin={refreshSession} />} />
            <Route path="/register" element={user ? <Navigate to="/shop" /> : <Register onLogin={refreshSession} />} />
            <Route path="/admin" element={<Dashboard user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/u/:id" element={<PublicProfile />} />
            <Route path="/community" element={<Community />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/open-store" element={<OpenStore />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;
