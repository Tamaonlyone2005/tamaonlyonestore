
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StorageService } from './services/storageService';
import { User } from './types';
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
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    refreshSession();
  }, []);

  const refreshSession = () => {
    const session = StorageService.getSession();
    setUser(session);
  };

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
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;
