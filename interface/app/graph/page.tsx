"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MeiliSearch } from 'meilisearch';
import { motion } from 'framer-motion';
import ReactLoading from 'react-loading';
import { FaSearch } from 'react-icons/fa';
import useAuthStore from '@/lib/hooks/auth-store';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

// Import custom components
import { extractTagsFromUseCase, processInspirationBatch, useTagFilter, Inspiration, TagResult } from './TagExtractor';
import TagStatistics, { TagFilterControls } from './TagStatistics';
import InspirationList from './InspirationList';

// 动态导入图形组件，确保客户端渲染
const InspirationGraph = dynamic(() => import('./InspirationGraph'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-secondary rounded-md">
      <ReactLoading type="spin" color="#3B82F6" height={50} width={50} />
      <span className="ml-4 text-text-primary">Loading...</span>
    </div>
  )
});

const InspirationTagAnalyzer = () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const { toast } = useToast();

  // States
  const [loading, setLoading] = useState(true);
  const [processingData, setProcessingData] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [tagResults, setTagResults] = useState<TagResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  
  // MeiliSearch client
  const apiUrl = '120.55.193.195:7700/';
  const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);

  // Use custom hook for tag filtering
  const {
    searchQuery,
    setSearchQuery,
    selectedTags,
    filteredResults,
    filterResults,
    toggleTag,
    resetFilters
  } = useTagFilter(tagResults);

  // Function to fetch total inspiration count
  const fetchInspirationCount = useCallback(async () => {
    try {
      const index = client.index('solution_id');
      const searchResults = await index.search('', {
        limit: 0,
      });
      return searchResults.estimatedTotalHits;
    } catch (error) {
      setError('Error fetching inspiration count');
      return 0;
    }
  }, [client]);

  // Function to fetch all inspirations
  const fetchAllInspirations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const totalCount = await fetchInspirationCount();
      if (totalCount === 0) {
        setLoading(false);
        setError('No inspirations found');
        return;
      }
      
      // Calculate number of batches needed
      const batchSize = 100;
      const totalBatches = Math.ceil(totalCount / batchSize);
      let allInspirations: Inspiration[] = [];
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const index = client.index('solution_id');
        const searchResults = await index.search('', {
          limit: batchSize,
          offset: batch * batchSize,
          sort: ['timestamp:desc'],
        });
        
        if (searchResults.hits.length > 0) {
          const modifiedResults = searchResults.hits.map((hit: any) => ({
            ...hit,
            id: hit._id,
          }));
          
          allInspirations = [...allInspirations, ...modifiedResults];
        }
        
        // Update progress
        setProgress(Math.round(((batch + 1) / totalBatches) * 100));
      }
      
      setInspirations(allInspirations);
    } catch (error) {
      setError('Error fetching inspirations');
      toast({
        title: "Error",
        description: "Failed to load inspirations. Please try again later.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [client, fetchInspirationCount, toast]);

  // Process inspirations to extract tags
  const processInspirationData = useCallback(() => {
    if (inspirations.length === 0) return;
    
    setProcessingData(true);
    setProgress(0);
    
    // Process in batches to avoid UI freezing
    const batchSize = 50;
    const totalBatches = Math.ceil(inspirations.length / batchSize);
    
    const processNextBatch = (batchIndex: number, accumResults: TagResult[] = [], allTagsSet = new Set<string>()) => {
      if (batchIndex >= totalBatches) {
        // All batches processed
        setTagResults(accumResults);
        setAvailableTags(Array.from(allTagsSet).sort());
        setProcessingData(false);
        return;
      }
      
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, inspirations.length);
      const batch = inspirations.slice(start, end);
      
      // Process this batch
      const updateProgress = (batchProgress: number) => {
        const overallProgress = Math.round(((batchIndex + (batchProgress / 100)) / totalBatches) * 100);
        setProgress(overallProgress);
      };
      
      const { results, allTags } = processInspirationBatch(batch, updateProgress);
      
      // Accumulate results and tags
      const newResults = [...accumResults, ...results];
      allTags.forEach(tag => allTagsSet.add(tag));
      
      // Process next batch (async to avoid blocking UI)
      setTimeout(() => processNextBatch(batchIndex + 1, newResults, allTagsSet), 0);
    };
    
    // Start processing
    processNextBatch(0);
  }, [inspirations]);

  // Fetch inspirations on component mount
  useEffect(() => {
    fetchAllInspirations();
  }, [fetchAllInspirations]);

  // Process inspirations to extract tags when inspirations change
  useEffect(() => {
    if (inspirations.length > 0) {
      processInspirationData();
    }
  }, [inspirations, processInspirationData]);

  // Apply filters when tag results change
  useEffect(() => {
    filterResults();
  }, [tagResults, filterResults]);

  // 处理节点点击事件
  const handleNodeClick = (node: any) => {
    if (node.type === 'inspiration') {
      const inspirationId = node.id.replace('insp-', '');
      router.push(`/inspiration/${inspirationId}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-primary">
        <div className="text-xl font-semibold text-text-primary mb-6">Loading Inspiration Data</div>
        <ReactLoading type="spin" color="#3B82F6" height={50} width={50} />
        <div className="mt-4 text-text-secondary">
          {progress}% Complete
        </div>
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Processing data state
  if (processingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-primary">
        <div className="text-xl font-semibold text-text-primary mb-6">Processing Data</div>
        <ReactLoading type="bubbles" color="#3B82F6" height={50} width={50} />
        <div className="mt-4 text-text-secondary">
          {progress}% Complete
        </div>
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-primary">
        <div className="text-xl font-semibold text-red-500 mb-4">{error}</div>
        <button
          onClick={() => fetchAllInspirations()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main UI
  return (
    <motion.div 
      className="flex flex-col h-screen bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-primary flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center space-x-4 mt-4">
          <h1 className="text-xl font-bold text-text-primary ml-2">Visualization</h1>
          
          {/* Filter Controls */}
          <TagFilterControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            availableTags={availableTags}
            toggleTag={toggleTag}
            resetFilters={resetFilters}
          />
        </div>
        
        <div className="flex space-x-2 mr-16">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${viewMode === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'bg-secondary text-text-primary'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 rounded ${viewMode === 'graph' 
              ? 'bg-blue-500 text-white' 
              : 'bg-secondary text-text-primary'}`}
          >
            Graph View
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Tag Statistics */}
        {/* <TagStatistics
          availableTags={availableTags}
          tagResults={tagResults}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          resetFilters={resetFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        /> */}
        
        {/* View Modes */}
        {viewMode === 'list' ? (
          <InspirationList
            filteredResults={filteredResults}
            totalResults={tagResults.length}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
          />
        ) : (
          <div className="mt-4">
            <InspirationGraph
              tagResults={tagResults}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              onNodeClick={handleNodeClick}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InspirationTagAnalyzer; 