'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, BarChart, Edit, FileText, AlertTriangle } from 'lucide-react';
import PromptManager from '@/components/developer/PromptManager';
import LogAnalyzer from '@/components/developer/LogAnalyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Dialog from '@/components/ui/dialog';
import Actionbar from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';

const DeveloperDashboardContent = () => {
  const [activeTab, setActiveTab] = useState('apis');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [actionbarVisible, setActionbarVisible] = useState(false);
  const { toast } = useToast();

  const tabs = [
    { id: 'apis', label: 'APIs', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'prompts', label: 'Prompts', icon: Edit },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'popups', label: 'Popups', icon: AlertTriangle },
  ];

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'apis':
        return (
          <div className="space-y-4 text-text-primary">
            <div className="bg-card p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">API Documentation</h3>
              <p className="text-muted-foreground">Access and manage your API keys, explore endpoints, and view usage statistics.</p>
            </div>
            <div className="bg-card p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">API Keys</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Production Key: ••••••••••••••••</li>
                <li>Development Key: ••••••••••••••••</li>
              </ul>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">Usage Statistics</h3>
              <p className="text-muted-foreground">View detailed analytics about your API usage, response times, and more.</p>
            </div>
            <div className="bg-card p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">Performance Metrics</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Average Response Time: 120ms</li>
                <li>Uptime: 99.99%</li>
                <li>Total Requests (30 days): 1,234,567</li>
              </ul>
            </div>
          </div>
        );
      case 'prompts':
        return <PromptManager />;
      case 'logs':
        return <LogAnalyzer />;
      case 'popups':
        return (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">Popup Examples</h3>
              <div className="space-y-2">
                <Button onClick={() => toast({ title: "Toast Notification", description: "This is a toast message" })}>
                  Show Toast
                </Button>
                <Button onClick={() => setDialogVisible(true)}>
                  Show Dialog
                </Button>
                <Button onClick={() => setActionbarVisible(true)}>
                  Show Actionbar
                </Button>
              </div>
            </div>
            <Dialog
              isOpen={dialogVisible}
              onClose={() => setDialogVisible(false)}
              title="Confirm Action"
              message="Are you sure you want to perform this action?"
              buttons={[
                { text: 'Cancel', onClick: () => setDialogVisible(false) },
                { text: 'Confirm', onClick: () => {
                  logger.log('Confirmed');
                  setDialogVisible(false);
                }},
              ]}
            />
            <Actionbar
              isOpen={actionbarVisible}
              onClose={() => setActionbarVisible(false)}
              title="Choose an action"
              buttons={[
                { text: 'Edit', onClick: () => {
                  logger.log('Edit clicked');
                  setActionbarVisible(false);
                }},
                { text: 'Delete', onClick: () => {
                  logger.log('Delete clicked');
                  setActionbarVisible(false);
                }},
                { text: 'Cancel', onClick: () => setActionbarVisible(false) },
              ]}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 text-text-primary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-2xl font-bold mb-6">Developer Dashboard</h1>

        <Tabs defaultValue="apis" className="w-full">
          <TabsList className="mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} onClick={() => setActiveTab(tab.id)}>
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {renderTabContent(tab.id)}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
};

const DeveloperDashboard = () => (
  <DeveloperDashboardContent />
);

export default DeveloperDashboard;
