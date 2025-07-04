/**
 * InspirationList.tsx
 * Component to display a list of inspirations with their extracted tags
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TagResult } from './TagExtractor';

interface InspirationListProps {
  filteredResults: TagResult[];
  totalResults: number;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
}

const InspirationList: React.FC<InspirationListProps> = ({
  filteredResults,
  totalResults,
  selectedTags,
  toggleTag
}) => {
  const router = useRouter();
  const [expandedInspiration, setExpandedInspiration] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedInspiration(prev => prev === id ? null : id);
  };

  if (filteredResults.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No matching results
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredResults.map(result => (
        <InspirationCard
          key={result.inspirationId}
          inspiration={result}
          isExpanded={expandedInspiration === result.inspirationId}
          toggleExpand={toggleExpand}
          toggleTag={toggleTag}
        />
      ))}
      
      <div className="p-4 border-t border-border-primary">
        <div className="flex justify-between items-center">
          <div className="text-sm text-text-secondary">
            Showing {filteredResults.length} / {totalResults} inspirations
          </div>
          {selectedTags.length > 0 && (
            <div className="flex items-center">
              <span className="text-sm text-text-secondary mr-2">Selected Tags:</span>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <SelectedTagPill 
                    key={tag} 
                    tag={tag} 
                    onRemove={() => toggleTag(tag)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InspirationCardProps {
  inspiration: TagResult;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  toggleTag: (tag: string) => void;
}

export const InspirationCard: React.FC<InspirationCardProps> = ({
  inspiration,
  isExpanded,
  toggleExpand,
  toggleTag
}) => {
  const router = useRouter();

  return (
    <motion.div
      className="border border-border-primary rounded-md overflow-hidden bg-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-secondary flex justify-between items-center"
        onClick={() => toggleExpand(inspiration.inspirationId)}
      >
        <h3 className="text-text-primary font-semibold">{inspiration.title}</h3>
        <span className="text-text-secondary text-sm">{inspiration.tags.length} tags</span>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-border-primary">
          <div className="mb-4">
            <h4 className="text-text-secondary font-medium mb-2">Use Case:</h4>
            <p className="text-text-primary text-sm bg-secondary p-3 rounded-md">
              {inspiration.useCase || "No Use Case data available"}
            </p>
          </div>
          
          <div>
            <h4 className="text-text-secondary font-medium mb-2">Extracted Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {inspiration.tags.map(tag => (
                <TagPill 
                  key={tag} 
                  tag={tag} 
                  onClick={() => toggleTag(tag)} 
                />
              ))}
              {inspiration.tags.length === 0 && (
                <span className="text-text-secondary italic">No tags extracted</span>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => router.push(`/inspiration/${inspiration.inspirationId}`)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const TagPill: React.FC<{
  tag: string;
  onClick?: () => void;
}> = ({ tag, onClick }) => (
  <span 
    onClick={onClick}
    className={`px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm ${onClick ? 'cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800' : ''}`}
  >
    {tag}
  </span>
);

export const SelectedTagPill: React.FC<{
  tag: string;
  onRemove: () => void;
}> = ({ tag, onRemove }) => (
  <span
    className="px-2 py-0.5 bg-secondary text-text-primary rounded-md text-xs flex items-center"
  >
    {tag}
    <button 
      onClick={onRemove}
      className="ml-1 text-text-secondary hover:text-text-primary"
    >
      ×
    </button>
  </span>
);

export default InspirationList; 