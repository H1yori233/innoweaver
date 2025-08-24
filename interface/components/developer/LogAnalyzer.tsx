import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/toast';
import { fetchLogs, fetchLogStats, LogEntry, LogStats } from '@/lib/actions/loadActions';
import { RefreshCw, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import Dialog from '@/components/ui/dialog';

const LOCAL_STORAGE_KEYS = {
  LOGS: 'log_analyzer_logs',
  STATS: 'log_analyzer_stats',
  LAST_FETCH: 'log_analyzer_last_fetch'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

const LogAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [selectedLogLevel, setSelectedLogLevel] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false);
  const [hasShownCacheMessage, setHasShownCacheMessage] = useState(false);

  // Modify initialization logic
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGS);
        const storedStats = localStorage.getItem(LOCAL_STORAGE_KEYS.STATS);
        const lastFetch = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_FETCH);
        
        if (storedLogs && storedStats && lastFetch) {
          setLogs(JSON.parse(storedLogs));
          setStats(JSON.parse(storedStats));
          
          // Only show cache expiration message on first load
          if (!hasShownCacheMessage) {
            const lastFetchTime = parseInt(lastFetch);
            const now = Date.now();
            if (now - lastFetchTime >= CACHE_DURATION) {
              toast({
                title: "Cache Expired",
                description: "The log data might be outdated. Consider refreshing to get the latest data.",
              });
              setHasShownCacheMessage(true);
            }
          }
        } else if (!hasShownCacheMessage) {
          // Only show message on first load and when there's no cached data
          toast({
            title: "No Cached Data",
            description: "Please click refresh to load log data.",
          });
          setHasShownCacheMessage(true);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        if (!hasShownCacheMessage) {
          toast({
            title: "Error",
            description: "Failed to load cached data. Please refresh to fetch new data.",
          });
          setHasShownCacheMessage(true);
        }
      }
    };

    loadFromLocalStorage();
  }, [toast, hasShownCacheMessage]);

  // Save data to local storage
  const saveToLocalStorage = (newLogs: LogEntry[], newStats: LogStats) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LOGS, JSON.stringify(newLogs));
      localStorage.setItem(LOCAL_STORAGE_KEYS.STATS, JSON.stringify(newStats));
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_FETCH, Date.now().toString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const handleRefreshClick = () => {
    setIsRefreshDialogOpen(true);
  };

  const confirmRefresh = async () => {
    setIsRefreshDialogOpen(false);
    setIsLoading(true);
    try {
      const [newLogs, newStats] = await Promise.all([
        fetchLogs(),
        fetchLogStats()
      ]);
      
      setLogs(newLogs);
      setStats(newStats);
      saveToLocalStorage(newLogs, newStats);
      
      toast({ 
        title: "Logs Refreshed", 
        description: "The log data has been updated." 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch logs. Loading from cache if available." 
      });
      
      const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGS);
      const storedStats = localStorage.getItem(LOCAL_STORAGE_KEYS.STATS);
      
      if (storedLogs && storedStats) {
        setLogs(JSON.parse(storedLogs));
        setStats(JSON.parse(storedStats));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to first page when switching pages or filter conditions
  useEffect(() => {
    setCurrentPage(1);
  }, [logFilter, selectedLogLevel]);

  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return <AlertCircle className="text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="text-yellow-500" />;
      case 'INFO':
        return <Info className="text-blue-500" />;
      case 'DEBUG':
        return <Bug className="text-gray-500" />;
      default:
        return null;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(logFilter.toLowerCase()) &&
    (selectedLogLevel === 'all' || log.level.toUpperCase() === selectedLogLevel.toUpperCase())
  );

  const chartData = stats ? [
    { name: 'Error', count: stats.error_count },
    { name: 'Warning', count: stats.warn_count },
    { name: 'Info', count: stats.info_count },
    { name: 'Debug', count: stats.debug_count },
  ] : [];

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const PaginationControls = () => {
    if (totalPages <= 1) {
        return null;
    }

    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        range.forEach(i => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-500">
                Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} entries, total {filteredLogs.length} entries
            </div>
            <div className="flex space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`dots-${index}`} className="px-2 py-1">...</span>
                    ) : (
                        <Button
                            key={`page-${page}`}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                        >
                            {page}
                        </Button>
                    )
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <Dialog
        isOpen={isRefreshDialogOpen}
        onClose={() => setIsRefreshDialogOpen(false)}
        title="Refresh Logs"
        message="Are you sure you want to refresh the logs? This will fetch new data from the server."
        buttons={[
          { 
            text: 'Cancel', 
            onClick: () => setIsRefreshDialogOpen(false) 
          },
          { 
            text: 'Refresh', 
            onClick: confirmRefresh 
          },
        ]}
      />

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Application Logs</TabsTrigger>
          <TabsTrigger value="stats">Log Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>View and analyze application logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input 
                  placeholder="Filter logs..." 
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="WARN">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleRefreshClick}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[50%]">Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          <span>{log.level}</span>
                        </TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.name}</TableCell>
                        <TableCell className="font-mono text-sm">{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Log Statistics</CardTitle>
              <CardDescription>Overview of log distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {stats && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Logs</CardTitle>
                        <CardDescription>{stats.total_logs}</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Error Rate</CardTitle>
                        <CardDescription>
                          {((stats.error_count / stats.total_logs) * 100).toFixed(2)}%
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogAnalyzer;
