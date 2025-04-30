/**
 * TagStatistics.tsx
 * Component to display statistics about tags and tag filtering UI
 */

import React from 'react';
import { FaFilter, FaRedo } from 'react-icons/fa';
import { TagResult } from './TagExtractor';

interface TagStatisticsProps {
  availableTags: string[];
  tagResults: TagResult[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  resetFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const TagStatistics: React.FC<TagStatisticsProps> = ({
  availableTags,
  tagResults,
  selectedTags,
  toggleTag,
  resetFilters,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="mb-4 p-4 bg-secondary rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-text-primary text-lg font-bold">Tag Statistics</h2>
        <span className="text-text-secondary">Total: {availableTags.length} tags</span>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const count = tagResults.filter(result => result.tags.includes(tag)).length;
          const isSelected = selectedTags.includes(tag);
          
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-md text-sm ${
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-border-primary text-text-secondary hover:bg-border-secondary'
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TagFilterControls: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  availableTags: string[];
  toggleTag: (tag: string) => void;
  resetFilters: () => void;
}> = ({
  searchQuery,
  setSearchQuery,
  selectedTags,
  availableTags,
  toggleTag,
  resetFilters
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Calculate tag frequencies for sorting
  const tagFrequencies = React.useMemo(() => {
    const counts = new Map<string, number>();
    // Assuming tagResults is accessible here, otherwise it needs to be passed down
    // If tagResults is NOT passed, we need to adjust the component props.
    // For now, let's assume availableTags is the list to sort.
    // A better approach might be to calculate frequencies where TagStatistics has tagResults.

    // If we need to sort based on actual usage in tagResults, TagStatistics should calculate
    // frequencies and pass a sorted list of tags or the frequency map.
    // Let's proceed assuming we sort the `availableTags` alphabetically for now,
    // as frequency calculation requires `tagResults` which isn't passed to TagFilterControls.
    // **Correction:** `availableTags` *is* passed. We can sort these.
    // However, sorting by *frequency* requires `tagResults`. Let's modify props.
    
    // Let's keep it simple for now and sort `availableTags` alphabetically.
    // A future enhancement could involve passing tagResults or frequencies.
    return availableTags.slice().sort((a, b) => a.localeCompare(b));
    
  }, [availableTags]); // Depend on availableTags

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search inspirations..."
          className="pl-10 pr-4 py-2 bg-primary border border-border-primary rounded-md 
            focus:outline-none focus:ring-1 focus:ring-blue-500 text-text-primary w-64"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-placeholder">
          <FaFilter />
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative group z-10">
          <button className="flex items-center space-x-2 px-3 py-2 bg-secondary rounded-md text-text-primary hover:bg-border-secondary">
            <FaFilter />
            <span>Filter Tags ({selectedTags.length})</span>
          </button>
          <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-primary border border-border-primary rounded-md shadow-lg 
            max-h-64 overflow-y-auto w-60 z-10 p-2">
            {tagFrequencies.map(tag => (
              <div key={tag} className="flex items-center p-2 hover:bg-secondary rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  id={`tag-filter-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="mr-2"
                />
                <label htmlFor={`tag-filter-${tag}`} className="text-text-primary cursor-pointer flex-1">
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={resetFilters}
          className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          <FaRedo />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export default TagStatistics; 