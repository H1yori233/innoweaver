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
import { FaKey, FaCheck, FaTimes, FaSignOutAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

// Default values for API settings
// const DEFAULT_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
// const DEFAULT_MODEL_NAME = "qwen-plus";
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

    // Additional logic to fetch more user info from backend could be added here
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
    router.push('/'); // Redirect to home page after logout
  };

  // Show restricted access message if user not logged in or ID doesn't match
  if (!authStore.email || authStore.id !== id) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="w-full max-w-3xl mx-auto border border-border-primary">
          <CardHeader className="bg-secondary">
            <CardTitle className="text-center text-text-primary">Restricted Access</CardTitle>
          </CardHeader>
          <CardContent className="bg-primary p-6">
            <p className="text-center text-red-500">You do not have permission to access this user profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-text-primary">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User information card */}
        <Card className="lg:col-span-1 border border-border-primary h-fit">
          <CardHeader className="bg-secondary">
            <CardTitle className="text-xl text-text-primary">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 bg-primary">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-text-primary">
                {authStore.name ? authStore.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary">{authStore.name || 'User'}</h3>
                <p className="text-text-secondary text-sm">{authStore.userType || 'Standard User'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-text-secondary text-sm">Email</Label>
                <div className="bg-secondary border border-border-secondary rounded-md px-3 py-2 text-text-primary text-sm mt-1 break-all">
                  {authStore.email || 'Not available'}
                </div>
              </div>

              <div>
                <Label htmlFor="userId" className="text-text-secondary text-sm">User ID</Label>
                <div className="bg-secondary border border-border-secondary rounded-md px-3 py-2 text-text-primary text-xs mt-1 font-mono break-all">
                  {authStore.id || 'Not available'}
                </div>
              </div>
            </div>

            {/* Add Logout Button here */}
            <div>
              <Button
                variant="destructive"
                className="w-full mt-4 mb-4"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" /> Log out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API settings card */}
        <Card className="lg:col-span-2 border border-border-primary">
          <CardHeader className="bg-secondary">
            <CardTitle className="text-xl text-text-primary">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 bg-primary">
            <div>
              <Label htmlFor="apiKey" className="text-text-secondary mb-1 block">API Key <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-secondary border-border-secondary text-text-primary pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                >
                  {showApiKey ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {apiKey ? (
                <p className="text-xs text-text-link mt-1 flex items-center">
                  <FaCheck className="mr-1" /> API Key set
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <FaTimes className="mr-1" /> API Key required
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="apiUrl" className="text-text-secondary mb-1 block">API URL</Label>
                <Input
                  id="apiUrl"
                  placeholder={`Enter API URL`}
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value || DEFAULT_API_URL)}
                  className="bg-secondary border-border-secondary text-text-primary"
                />
                {apiUrl === DEFAULT_API_URL ? (
                  <p className="text-xs text-text-secondary mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-text-secondary mr-1"></span> Using default
                  </p>
                ) : (
                  <p className="text-xs text-text-link mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-text-link mr-1"></span> Using custom
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="modelName" className="text-text-secondary mb-1 block">Model Name</Label>
                <Input
                  id="modelName"
                  placeholder={`Enter model name`}
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value || DEFAULT_MODEL_NAME)}
                  className="bg-secondary border-border-secondary text-text-primary"
                />
                {modelName === DEFAULT_MODEL_NAME ? (
                  <p className="text-xs text-text-secondary mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-text-secondary mr-1"></span> Using default
                  </p>
                ) : (
                  <p className="text-xs text-text-link mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-text-link mr-1"></span> Using custom
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs text-text-secondary mb-3">
                <p className="mb-1">Default configuration:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-4 list-disc">
                  <li><span className="font-mono">{DEFAULT_API_URL}</span></li>
                  <li><span className="font-mono">{DEFAULT_MODEL_NAME}</span></li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveApiSettings}
                  className="w-full sm:w-1/2 bg-secondary hover:bg-border-secondary text-text-primary"
                >
                  Save Settings
                </Button>
                <Button
                  onClick={handleTestApiConnection}
                  className="w-full sm:w-1/2 bg-secondary hover:bg-border-secondary text-text-primary"
                  disabled={testStatus === 'loading'}
                >
                  {testStatus === 'loading' ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary mr-2"></div>
                      Testing...
                    </span>
                  ) : 'Test Connection'}
                </Button>
              </div>
            </div>

            {testStatus !== 'idle' && (
              <div className={`p-3 rounded border max-h-60 overflow-y-auto custom-scrollbar ${testStatus === 'success' ? 'border-green-700 bg-green-900/20' :
                  testStatus === 'error' ? 'border-red-700 bg-red-900/20' :
                    'bg-secondary border-border-secondary'
                }`}>
                <div className="flex items-start">
                  <div className="mt-0.5">
                    {testStatus === 'success' && <FaCheck className="text-green-500 mr-2" />}
                    {testStatus === 'error' && <FaTimes className="text-red-500 mr-2" />}
                    {testStatus === 'loading' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary mr-2"></div>
                    )}
                  </div>
                  <div className={`${testStatus === 'success' ? 'text-green-400' :
                      testStatus === 'error' ? 'text-red-400' :
                        'text-text-secondary'
                    }`}>
                    <p className="font-medium mb-1">
                      {testStatus === 'success' ? 'Connection Successful' :
                        testStatus === 'error' ? 'Connection Failed' :
                          'Testing Connection'}
                    </p>
                    <p className="text-sm break-all">{testMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserPage;
