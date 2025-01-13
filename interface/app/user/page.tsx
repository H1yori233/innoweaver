// /user/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FaSignOutAlt, FaKey, FaUser } from "react-icons/fa";
import useAuthStore from "@/lib/hooks/auth-store";

// 用户头像组件
const UserAvatar = ({ user, onLogout }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
      >
        <FaUser className="text-2xl" />
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl">
          <div className="px-4 py-2">
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            <FaSignOutAlt className="mr-2 inline-block" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

// 用户信息组件
const UserInfo = ({ user }) => (
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
const ApiKeySection = ({ apiKey, onApiKeyChange, onSave }) => (
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
const AuthButtons = ({ onLogout }) => (
  <div className="flex justify-center mt-6">
    <button
      onClick={onLogout}
      className="bg-primary text-text-primary p-3 rounded-lg w-full max-w-sm hover:bg-primary-dark transition-colors"
    >
      <FaSignOutAlt className="mr-2 inline-block" />
      Logout
    </button>
  </div>
);

// 用户创作内容组件
const UserCreations = ({ creations }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
    {creations.map((creation, index) => (
      <div
        key={index}
        className="bg-white p-6 rounded-lg shadow-md border border-secondary transition-transform transform hover:scale-105"
      >
        <h3 className="text-xl font-semibold text-text-primary">{creation.title}</h3>
        <p className="mt-2 text-text-secondary">{creation.description}</p>
      </div>
    ))}
  </div>
);

// 主页面组件
const UserPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [user, setUser] = useState(null);
  const [creations, setCreations] = useState([]);
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
      setCreations([
        { title: 'Creation 1', description: 'This is the first creation.' },
        { title: 'Creation 2', description: 'This is the second creation.' },
        { title: 'Creation 3', description: 'This is the third creation.' },
      ]);
    }
  }, [authStore.userType]);

  if (!isMounted || !user) return null;

  const handleLogout = () => {
    authStore.clearUserData();
  };

  const handleApiKeyChange = (newApiKey) => setApiKey(newApiKey);

  const handleSaveApiKey = () => {
    alert('API Key saved!');
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary min-h-screen p-8 ml-[12.5rem] transition-colors duration-300">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-4xl font-bold text-text-primary">User Profile</h1>
          <UserAvatar user={user} onLogout={handleLogout} />
        </div>
        <UserInfo user={user} />
        <ApiKeySection apiKey={apiKey} onApiKeyChange={handleApiKeyChange} onSave={handleSaveApiKey} />
        <UserCreations creations={creations} />
      </div>
    </div>
  );
};

export default UserPage;