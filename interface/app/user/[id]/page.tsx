"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { fetchSetAPIKey, fetchTestAPIConnection, fetchLogin } from '@/lib/actions/taskActions';
import {
  CheckCircle,
  XCircle,
  LogOut,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Copy,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Default API configuration
const DEFAULT_API_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL_NAME = "deepseek-chat";

const UserPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const authStore = useAuthStore();
  const { toast } = useToast();

  // State management
  const [apiUrl, setApiUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isConfigChanged, setIsConfigChanged] = useState(false);

  // Initialize configuration
  useEffect(() => {
    if (authStore.apiKey) setApiKey(authStore.apiKey);
    setApiUrl(authStore.apiUrl || DEFAULT_API_URL);
    setModelName(authStore.modelName || DEFAULT_MODEL_NAME);
  }, [authStore.apiKey, authStore.apiUrl, authStore.modelName]);

  // Monitor configuration changes
  useEffect(() => {
    const hasChanged =
      apiKey !== (authStore.apiKey || '') ||
      apiUrl !== (authStore.apiUrl || DEFAULT_API_URL) ||
      modelName !== (authStore.modelName || DEFAULT_MODEL_NAME);
    setIsConfigChanged(hasChanged);
  }, [apiKey, apiUrl, modelName, authStore]);

  // Save API configuration
  const handleSaveApiSettings = async () => {
    if (!apiKey?.trim()) {
      toast({
        title: "Missing API Key",
        description: "Please enter your API key to continue",
        type: "warning"
      });
      return;
    }

    try {
      const finalApiUrl = apiUrl.trim() || DEFAULT_API_URL;
      const finalModelName = modelName.trim() || DEFAULT_MODEL_NAME;

      await fetchSetAPIKey(apiKey.trim(), finalApiUrl, finalModelName);

      authStore.setUserData({
        apiKey: apiKey.trim(),
        apiUrl: finalApiUrl,
        modelName: finalModelName
      });

      // Refresh user information
      if (authStore.email && authStore.password) {
        await fetchLogin(authStore.email, authStore.password);
      }

      toast({
        title: "Configuration Saved",
        description: "Your API settings have been saved successfully",
      });

      setApiUrl(finalApiUrl);
      setModelName(finalModelName);
      setIsConfigChanged(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your API settings. Please try again.",
        type: "error"
      });
    }
  };

  // Test API connection
  const handleTestApiConnection = async () => {
    if (!apiKey?.trim()) {
      toast({
        title: "Missing API Key",
        description: "Please enter your API key to test the connection",
        type: "warning"
      });
      return;
    }

    try {
      setTestStatus('loading');
      setTestMessage('Establishing connection...');

      const finalApiUrl = apiUrl.trim() || DEFAULT_API_URL;
      const finalModelName = modelName.trim() || DEFAULT_MODEL_NAME;

      toast({
        title: "Testing Connection",
        description: `Testing ${finalModelName} at ${finalApiUrl}`,
      });

      const result = await fetchTestAPIConnection(apiKey.trim(), finalApiUrl, finalModelName);

      if (result.success) {
        setTestStatus('success');
        setTestMessage(`Successfully connected to ${finalModelName} at ${finalApiUrl}`);
        toast({
          title: "Connection Successful",
          description: "Your API configuration is working correctly",
        });
      } else {
        setTestStatus('error');
        setTestMessage(result.message || result.details?.raw_error || "Connection test failed");
        toast({
          title: "Connection Failed",
          description: result.message || "Please check your API configuration",
          type: "error"
        });
      }
    } catch (error) {
      setTestStatus('error');
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setTestMessage(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
        type: "error"
      });
    }
  };

  // Copy API key
  const handleCopyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    }
  };

  // Clear API configuration
  const handleClearConfig = () => {
    setApiKey('');
    setApiUrl(DEFAULT_API_URL);
    setModelName(DEFAULT_MODEL_NAME);
    setTestStatus('idle');
    setTestMessage('');
  };

  // Logout
  const handleLogout = () => {
    authStore.clearUserData();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
    router.push('/');
  };

  // Back
  const handleBack = () => {
    router.back();
  };

  // Access permission check
  if (!authStore.email || authStore.id !== id) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-error/20 bg-error/5">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-error" />
              </div>
              <CardTitle className="text-xl text-text-primary">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-text-secondary mb-6">
                You don't have permission to access this profile
              </p>
              <Button
                onClick={() => router.push('/')}
                className="btn-primary"
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
    <div className="min-h-screen bg-canvas">
      {/* Header navigation */}
      <div className="sticky top-0 z-10 bg-canvas/80 backdrop-blur-md border-b border-border-subtle">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center space-x-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            <div className="text-center">
              <h1 className="text-xl font-semibold">Profile Settings</h1>
              <p className="text-sm text-text-tertiary">Manage your account and API configuration</p>
            </div>

            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* User profile card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="card h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Profile</CardTitle>
              </CardHeader>

              <CardContent className="p-6 pt-2 flex-1 flex flex-col">
                {/* User avatar and information */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-organic-sage to-organic-clay 
                                 flex items-center justify-center text-xl font-bold text-surface-elevated 
                                 shadow-sm mx-auto mb-3">
                    {authStore.name ? authStore.name.substring(0, 2).toUpperCase() : 'U'}
                  </div>

                  <h3 className="text-lg font-semibold text-text-primary">
                    {authStore.name || 'User'}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {authStore.userType || 'Standard Account'}
                  </p>
                </div>

                {/* User details */}
                <div className="space-y-3 flex-1">
                  <div className="bg-surface-secondary rounded-lg p-3">
                    <Label className="text-xs text-text-tertiary uppercase tracking-wide">Email</Label>
                    <p className="text-sm font-mono text-text-primary mt-1 break-all">
                      {authStore.email || 'Not available'}
                    </p>
                  </div>

                  <div className="bg-surface-secondary rounded-lg p-3">
                    <Label className="text-xs text-text-tertiary uppercase tracking-wide">User ID</Label>
                    <p className="text-xs font-mono text-text-secondary mt-1 break-all">
                      {authStore.id || 'Not available'}
                    </p>
                  </div>
                </div>

                {/* Logout button */}
                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <Button
                    variant="destructive"
                    className="w-full bg-error hover:bg-error/90 text-surface-elevated"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API configuration card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="card h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">API Configuration</CardTitle>

                  {isConfigChanged && (
                    <div className="flex items-center space-x-2 text-warning text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Unsaved</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-6 flex-1">

                {/* API key configuration */}
                <div>
                  <h3 className="font-medium mb-3">API Key</h3>

                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="input-field pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                      {apiKey && (
                        <button
                          type="button"
                          onClick={handleCopyApiKey}
                          className="p-1.5 text-text-tertiary hover:text-text-primary rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 text-text-tertiary hover:text-text-primary rounded"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    {apiKey ? (
                      <div className="flex items-center text-success">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>API key configured</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-error">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span>API key required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Model configuration */}
                <div>
                  <h3 className="font-medium mb-3">Model Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">API Endpoint</Label>
                      <Input
                        placeholder="Enter API URL"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="input-field"
                      />
                      <p className="text-xs text-text-tertiary mt-1">
                        {apiUrl === DEFAULT_API_URL ? 'Default endpoint' : 'Custom endpoint'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Model Name</Label>
                      <Input
                        placeholder="Enter model name"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className="input-field"
                      />
                      <p className="text-xs text-text-tertiary mt-1">
                        {modelName === DEFAULT_MODEL_NAME ? 'Default model' : 'Custom model'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t border-border-subtle mt-auto">
                  <Button
                    onClick={handleSaveApiSettings}
                    className="flex-1"
                    disabled={!isConfigChanged}
                  >
                    Save Configuration
                  </Button>

                  <Button
                    onClick={handleTestApiConnection}
                    variant="outline"
                    className="flex-1"
                    disabled={testStatus === 'loading' || !apiKey}
                  >
                    {testStatus === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </div>

                {/* Test results */}
                <AnimatePresence>
                  {testStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-lg border ${testStatus === 'success'
                          ? 'border-success/30 bg-success/5'
                          : testStatus === 'error'
                            ? 'border-error/30 bg-error/5'
                            : 'border-border-default bg-surface-secondary'
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 pt-0.5">
                          {testStatus === 'success' && (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )}
                          {testStatus === 'error' && (
                            <XCircle className="w-5 h-5 text-error" />
                          )}
                          {testStatus === 'loading' && (
                            <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className={`font-medium mb-1 ${testStatus === 'success' ? 'text-success' :
                              testStatus === 'error' ? 'text-error' : 'text-text-primary'
                            }`}>
                            {testStatus === 'success' ? 'Connection Successful' :
                              testStatus === 'error' ? 'Connection Failed' : 'Testing Connection'}
                          </h4>
                          <p className="text-sm text-text-secondary">
                            {testMessage}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
