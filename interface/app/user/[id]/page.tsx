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
import { 
  FaKey, 
  FaCheck, 
  FaTimes, 
  FaSignOutAlt, 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaCog, 
  FaRocket,
  FaShieldAlt,
  FaArrowLeft
} from 'react-icons/fa';
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
                  <FaShieldAlt className="text-red-500 text-2xl" />
                </div>
              </div>
              <CardTitle className="text-center text-text-primary text-xl">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <p className="text-text-secondary mb-6">
                You do not have permission to access this user profile
              </p>
              <Button 
                onClick={() => router.push('/')}
                                 className="bg-text-link hover:bg-text-linkHover text-white px-6 py-2 rounded-lg transition-all duration-200"
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-primary/80">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-text-secondary hover:text-text-primary hover:bg-secondary/50 transition-all duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="xl:col-span-1"
          >
            <Card className="border border-border-primary backdrop-blur-sm bg-primary/80 shadow-xl h-fit sticky top-24">
                             <CardHeader className="bg-gradient-to-br from-text-link/10 to-text-linkHover/10 border-b border-border-secondary">
                 <div className="flex items-center space-x-2 text-text-primary">
                   <FaUser className="text-text-link" />
                  <CardTitle className="text-lg">User Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Avatar and basic info */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                                         <div className="w-20 h-20 rounded-full bg-gradient-to-br from-text-link to-text-linkHover flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {authStore.name ? authStore.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mt-4">
                    {authStore.name || 'User'}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {authStore.userType || 'Standard User'}
                  </p>
                </div>

                {/* User details */}
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border-secondary">
                    <Label className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                      Email Address
                    </Label>
                    <p className="text-text-primary text-sm mt-1 break-all font-mono">
                      {authStore.email || 'Not available'}
                    </p>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 border border-border-secondary">
                    <Label className="text-text-secondary text-xs font-medium uppercase tracking-wide">
                      User ID
                    </Label>
                    <p className="text-text-primary text-xs mt-1 break-all font-mono">
                      {authStore.id || 'Not available'}
                    </p>
                  </div>
                </div>

                {/* Logout button */}
                <div className="mt-6 pt-6 border-t border-border-secondary">
                  <Button
                    variant="destructive"
                    className="w-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Configuration Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="xl:col-span-3"
          >
            <Card className="border border-border-primary backdrop-blur-sm bg-primary/80 shadow-xl">
                             <CardHeader className="bg-gradient-to-br from-text-link/10 to-text-linkHover/10 border-b border-border-secondary">
                 <div className="flex items-center space-x-2 text-text-primary">
                   <FaCog className="text-text-link" />
                  <CardTitle className="text-lg">API Configuration</CardTitle>
                </div>
                <p className="text-text-secondary text-sm mt-2">
                  Configure your AI model settings for optimal performance
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* API Key Section */}
                  <div className="space-y-4">
                                         <div className="flex items-center space-x-2 mb-4">
                       <FaKey className="text-text-link" />
                      <h3 className="text-lg font-semibold text-text-primary">API Authentication</h3>
                    </div>
                    
                    <div>
                      <Label htmlFor="apiKey" className="text-text-secondary mb-2 block font-medium">
                        API Key <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your API Key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                                                     className="bg-secondary/50 border-border-secondary text-text-primary pr-12 h-12 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-text-link/20 focus:border-text-link"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors duration-200 p-1"
                          aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                        >
                          {showApiKey ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {apiKey ? (
                        <p className="text-xs text-green-500 mt-2 flex items-center">
                          <FaCheck className="mr-1" /> API Key configured
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 mt-2 flex items-center">
                          <FaTimes className="mr-1" /> API Key required for functionality
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Model Configuration */}
                  <div className="space-y-4">
                                         <div className="flex items-center space-x-2 mb-4">
                       <FaRocket className="text-text-link" />
                      <h3 className="text-lg font-semibold text-text-primary">Model Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="apiUrl" className="text-text-secondary mb-2 block font-medium">
                          API Endpoint
                        </Label>
                                                 <Input
                           id="apiUrl"
                           placeholder="Enter API URL"
                           value={apiUrl}
                           onChange={(e) => setApiUrl(e.target.value || DEFAULT_API_URL)}
                           className="bg-secondary/50 border-border-secondary text-text-primary h-12 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-text-link/20 focus:border-text-link"
                        />
                        <div className="mt-2">
                          {apiUrl === DEFAULT_API_URL ? (
                            <p className="text-xs text-text-secondary flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              Using default endpoint
                            </p>
                                                     ) : (
                             <p className="text-xs text-text-link flex items-center">
                               <span className="inline-block w-2 h-2 rounded-full bg-text-link mr-2"></span>
                               Using custom endpoint
                             </p>
                           )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="modelName" className="text-text-secondary mb-2 block font-medium">
                          Model Name
                        </Label>
                                                 <Input
                           id="modelName"
                           placeholder="Enter model name"
                           value={modelName}
                           onChange={(e) => setModelName(e.target.value || DEFAULT_MODEL_NAME)}
                           className="bg-secondary/50 border-border-secondary text-text-primary h-12 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-text-link/20 focus:border-text-link"
                        />
                        <div className="mt-2">
                          {modelName === DEFAULT_MODEL_NAME ? (
                            <p className="text-xs text-text-secondary flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              Using default model
                            </p>
                                                     ) : (
                             <p className="text-xs text-text-link flex items-center">
                               <span className="inline-block w-2 h-2 rounded-full bg-text-link mr-2"></span>
                               Using custom model
                             </p>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Default configuration info */}
                    <div className="bg-secondary/30 rounded-lg p-4 border border-border-secondary">
                      <p className="text-xs text-text-secondary mb-2 font-medium">Default Configuration:</p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-text-secondary">Endpoint: </span>
                          <span className="font-mono text-text-primary">{DEFAULT_API_URL}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Model: </span>
                          <span className="font-mono text-text-primary">{DEFAULT_MODEL_NAME}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border-secondary">
                                         <Button
                       onClick={handleSaveApiSettings}
                       className="flex-1 bg-text-link hover:bg-text-linkHover text-white h-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      <FaCheck className="mr-2" />
                      Save Configuration
                    </Button>
                    <Button
                      onClick={handleTestApiConnection}
                      className="flex-1 bg-secondary hover:bg-border-secondary text-text-primary h-12 rounded-lg transition-all duration-200 border border-border-secondary font-medium"
                      disabled={testStatus === 'loading'}
                    >
                      {testStatus === 'loading' ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-primary mr-2"></div>
                          Testing Connection...
                        </span>
                      ) : (
                        <>
                          <FaRocket className="mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Test Results */}
                  {testStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-6 rounded-lg border max-h-60 overflow-y-auto ${
                        testStatus === 'success' 
                          ? 'border-green-500/30 bg-green-500/10' 
                          : testStatus === 'error' 
                          ? 'border-red-500/30 bg-red-500/10' 
                          : 'bg-secondary/30 border-border-secondary'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {testStatus === 'success' && (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <FaCheck className="text-white text-xs" />
                            </div>
                          )}
                          {testStatus === 'error' && (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <FaTimes className="text-white text-xs" />
                            </div>
                          )}
                                                     {testStatus === 'loading' && (
                             <div className="w-6 h-6 rounded-full border-2 border-text-link border-t-transparent animate-spin"></div>
                           )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold mb-2 ${
                            testStatus === 'success' 
                              ? 'text-green-400' 
                              : testStatus === 'error' 
                              ? 'text-red-400' 
                              : 'text-text-primary'
                          }`}>
                            {testStatus === 'success' ? 'Connection Successful' :
                             testStatus === 'error' ? 'Connection Failed' :
                             'Testing Connection'}
                          </p>
                          <p className={`text-sm break-all ${
                            testStatus === 'success' 
                              ? 'text-green-300' 
                              : testStatus === 'error' 
                              ? 'text-red-300' 
                              : 'text-text-secondary'
                          }`}>
                            {testMessage}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
