"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { fetchSetAPIKey, fetchTestAPIConnection } from '@/lib/actions/taskActions';
import { fetchLogin } from '@/lib/actions/userActions';
import { motion } from 'framer-motion';

// Default values for API settings
const DEFAULT_API_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL_NAME = "deepseek-chat";

const UserPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const authStore = useAuthStore();
  const { toast } = useToast();

  // API settings state
  const [apiUrl, setApiUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    // Load current API info from authStore when component mounts
    if (authStore.apiKey) {
      setApiKey(authStore.apiKey);
    }

    // If user has previously set API URL, use that, otherwise use default
    if (authStore.apiUrl) {
      setApiUrl(authStore.apiUrl);
    } else {
      setApiUrl(DEFAULT_API_URL);
    }

    // If user has previously set model name, use that, otherwise use default
    if (authStore.modelName) {
      setModelName(authStore.modelName);
    } else {
      setModelName(DEFAULT_MODEL_NAME);
    }
  }, [authStore.apiKey, authStore.apiUrl, authStore.modelName]);

  const handleSaveApiSettings = async () => {
    if (!apiKey) {
      toast({
        title: "Warning",
        description: "Please enter your API Key",
        type: "warning"
      });
      return;
    }

    try {
      // Use default values if fields are empty
      const finalApiUrl = apiUrl || DEFAULT_API_URL;
      const finalModelName = modelName || DEFAULT_MODEL_NAME;

      // Save API settings
      await fetchSetAPIKey(apiKey, finalApiUrl, finalModelName);

      // Update authStore
      authStore.setUserData({
        apiKey,
        apiUrl: finalApiUrl,
        modelName: finalModelName
      });

      // Refresh user info
      if (authStore.email && authStore.password) {
        await fetchLogin(authStore.email, authStore.password);
      }

      toast({
        title: "Success",
        description: "API settings saved successfully",
      });

      // Update local state to reflect saved values
      setApiUrl(finalApiUrl);
      setModelName(finalModelName);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API settings",
        type: "error"
      });
    }
  };

  const handleTestApiConnection = async () => {
    if (!apiKey) {
      toast({
        title: "Warning",
        description: "Please enter your API Key to test",
        type: "warning"
      });
      return;
    }

    try {
      setTestStatus('loading');
      setTestMessage('Testing API connection...');

      toast({
        title: "Testing",
        description: "Testing API connection...",
      });

      // Use default values if fields are empty
      const finalApiUrl = apiUrl || DEFAULT_API_URL;
      const finalModelName = modelName || DEFAULT_MODEL_NAME;

      // Display what we're testing with
      setTestMessage(`Testing connection to ${finalApiUrl} with model ${finalModelName}...`);

      const result = await fetchTestAPIConnection(apiKey, finalApiUrl, finalModelName);

      if (result.success) {
        setTestStatus('success');
        setTestMessage(`Connection successful to ${finalApiUrl} with model ${finalModelName}`);
        toast({
          title: "Success",
          description: "API connection tested successfully",
        });
      } else {
        setTestStatus('error');
        setTestMessage(result.message || result.details?.raw_error || "API connection test failed");
        toast({
          title: "Error",
          description: result.message || "API connection test failed",
          type: "error"
        });
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Error",
        description: "API connection test failed",
        type: "error"
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    authStore.clearUserData();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Show restricted access message if user not logged in or ID doesn't match
  if (!authStore.email || authStore.id !== id) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border border-border-primary backdrop-blur-sm bg-primary/80 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-border-secondary">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-red-500"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
              </div>
              <CardTitle className="text-center text-text-primary">
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-text-secondary text-center mb-6">
                You don't have permission to access this page. Please log in with the correct account.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={handleBack} 
                  variant="outline" 
                  className="flex-1"
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
                    className="mr-2"
                  >
                    <path d="M19 12H5"></path>
                    <path d="M12 19l-7-7 7-7"></path>
                  </svg>
                  Go Back
                </Button>
                <Button 
                  onClick={handleLogout} 
                  className="flex-1"
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
                    className="mr-2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16,17 21,12 16,7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={handleBack} 
              variant="ghost" 
              className="flex items-center gap-2"
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
              >
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
              Back
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="flex items-center gap-2"
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
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">User Settings</h1>
          <p className="text-text-secondary mt-2">Manage your API settings and preferences</p>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* API Settings Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-border-primary backdrop-blur-sm bg-primary/80 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-border-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-blue-500"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                      <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                      <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <CardTitle className="text-text-primary">API Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* API URL */}
                <div className="space-y-2">
                  <Label htmlFor="apiUrl" className="text-text-primary">API URL</Label>
                  <Input
                    id="apiUrl"
                    type="text"
                    placeholder="Enter API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="bg-background/50 border-border-secondary text-text-primary"
                  />
                </div>

                {/* Model Name */}
                <div className="space-y-2">
                  <Label htmlFor="modelName" className="text-text-primary">Model Name</Label>
                  <Input
                    id="modelName"
                    type="text"
                    placeholder="Enter model name"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="bg-background/50 border-border-secondary text-text-primary"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-text-primary">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-background/50 border-border-secondary text-text-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
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
                          className="text-text-secondary"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
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
                          className="text-text-secondary"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleTestApiConnection}
                    disabled={testStatus === 'loading'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {testStatus === 'loading' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Testing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
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
                        >
                          <polyline points="9,11 12,14 22,4"></polyline>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        Test Connection
                      </div>
                    )}
                  </Button>
                  <Button 
                    onClick={handleSaveApiSettings}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                      className="mr-2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                      <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                      <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Test Results Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-border-primary backdrop-blur-sm bg-primary/80 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-border-secondary">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-green-500"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                  </div>
                  <CardTitle className="text-text-primary">Connection Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {testStatus === 'idle' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                    </div>
                    <p className="text-text-secondary">Click "Test Connection" to check your API settings</p>
                  </div>
                )}

                {testStatus === 'loading' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-text-secondary">Testing connection...</p>
                  </div>
                )}

                {testStatus === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-green-500"
                      >
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                    <p className="text-green-500 font-semibold mb-2">Connection Successful!</p>
                    <p className="text-text-secondary text-sm">{testMessage}</p>
                  </div>
                )}

                {testStatus === 'error' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-red-500"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                    <p className="text-red-500 font-semibold mb-2">Connection Failed</p>
                    <p className="text-text-secondary text-sm">{testMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
