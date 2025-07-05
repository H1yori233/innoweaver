"use client";

import React, { useState, useEffect } from "react";
import useAuthStore from "@/lib/hooks/auth-store";

// 用户信息组件
const UserInfo = ({ user }: { user: any }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-secondary transition-transform transform hover:scale-105">
    <h2 className="text-xl font-semibold text-text-primary">User Info</h2>
    <div className="mt-4 text-text-secondary">
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>User Type:</strong> {user.userType}</p>
    </div>
  </div>
);

// API Key 输入和保存区块
const ApiKeySection = ({ apiKey, onApiKeyChange, onSave }: { apiKey: string; onApiKeyChange: (key: string) => void; onSave: () => void }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mt-6 border border-secondary">
    <h3 className="text-xl font-semibold text-text-primary">API Key</h3>
    <input
      type="text"
      value={apiKey}
      onChange={(e) => onApiKeyChange(e.target.value)}
      placeholder="Enter OpenAI API Key"
      className="mt-2 w-full p-3 rounded-lg bg-transparent border-2 border-neutral-600 text-text-primary focus:ring-2 focus:ring-primary"
    />
    <button
      onClick={onSave}
      className="mt-4 w-full bg-primary text-text-primary p-3 rounded-lg hover:bg-primary-dark transition-colors"
    >
      Save API Key
    </button>
  </div>
);

// 退出按钮组件
const AuthButtons = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex justify-center mt-6">
    <button
      onClick={onLogout}
      className="bg-primary text-text-primary p-3 rounded-lg w-full max-w-sm hover:bg-primary-dark transition-colors"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="mr-2 inline-block"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16,17 21,12 16,7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Logout
    </button>
  </div>
);

// 主页面组件
const UserPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [user, setUser] = useState<any>(null);
  const authStore = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // 延迟渲染
  }, []);

  useEffect(() => {
    // 假设已经获得用户信息
    if (authStore.userType) {
      setUser({
        email: 'user@example.com',
        name: 'John Doe',
        userType: authStore.userType || 'Admin',
      });
    }
  }, [authStore.userType]);

  if (!isMounted || !user) return null;

  const handleLogout = () => {
    authStore.clearUserData();
  };

  const handleApiKeyChange = (newApiKey: string) => setApiKey(newApiKey);

  const handleSaveApiKey = () => {
    alert('API Key saved!');
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary min-h-screen p-8 transition-colors duration-300">
      <h1 className="text-4xl font-bold text-text-primary mb-8">User Profile</h1>

      {/* 页面主体区域 */}
      <div className="w-full max-w-3xl space-y-8">
        <UserInfo user={user} />
        <ApiKeySection apiKey={apiKey} onApiKeyChange={handleApiKeyChange} onSave={handleSaveApiKey} />
        <AuthButtons onLogout={handleLogout} />
      </div>
    </div>
  );
};

export default UserPage;
