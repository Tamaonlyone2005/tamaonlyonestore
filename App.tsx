
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StorageService } from './services/storageService';
import { User, SiteProfile } from './types';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import SellerList from './pages/SellerList'; 
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
import FeedbackPage from './pages/FeedbackPage';
import { ToastProvider } from './components/Toast';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SiteProfile | null>(null);

  useEffect(() => {
    const initSession = async () => {
        let session = StorageService.getSession();
        
        if (session) {
            try {
                const freshUser = await StorageService.findUser(session.id);
                if (freshUser) {
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
    const session = StorageService.getSession();
    setUser(session);
  };

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
            <Route path="/sellers" element={<SellerList />} />
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
            <Route path="/feedback" element={<FeedbackPage />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;
