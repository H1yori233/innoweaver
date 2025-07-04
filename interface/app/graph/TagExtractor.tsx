/**
 * TagExtractor.tsx
 * A utility component for extracting tags from inspiration use cases using NLP techniques
 */

import { useState, useCallback } from 'react';

// Interfaces
export interface TagResult {
  inspirationId: string;
  title: string;
  useCase: string;
  tags: string[];
}

export interface Inspiration {
  id: string;
  _id: string;
  solution: {
    Title: string;
    Function: string;
    "Use Case": string;
    "Technical Method": any;
    "Possible Results": any;
    "Evaluation_Result"?: {
      score: number;
      analysis: string;
    }
  };
  query?: string;
  query_analysis_result?: any;
  timestamp: number;
}

/**
 * Process a batch of inspirations to extract tags from their use cases
 */
export const processInspirationBatch = (
  inspirations: Inspiration[],
  setProgress?: (progress: number) => void
): { results: TagResult[], allTags: string[] } => {
  if (!inspirations || inspirations.length === 0) {
    return { results: [], allTags: [] };
  }
  
  const results: TagResult[] = [];
  const allTagsSet = new Set<string>();
  
  inspirations.forEach((inspiration, index) => {
    if (!inspiration.solution) return;
    
    const useCase = inspiration.solution["Use Case"] || '';
    const extractedTags = extractTagsFromUseCase(useCase);
    
    // Add tags to global set
    extractedTags.forEach(tag => allTagsSet.add(tag));
    
    // Add to results
    results.push({
      inspirationId: inspiration.id,
      title: inspiration.solution.Title || 'Untitled',
      useCase: useCase,
      tags: extractedTags
    });

    // Update progress if callback provided
    if (setProgress) {
      setProgress(Math.round(((index + 1) / inspirations.length) * 100));
    }
  });
  
  // Return results and sorted array of unique tags
  return {
    results,
    allTags: Array.from(allTagsSet).sort()
  };
};

/**
 * Extract tags from Use Case text using NLP techniques
 */
export const extractTagsFromUseCase = (useCase: string): string[] => {
  if (!useCase) return [];
  
  // 1. Clean text - remove punctuation (keep hyphens in words), convert to lowercase
  const cleanText = useCase.toLowerCase()
    .replace(/\b's\b/g, '') // Remove possessive 's
    .replace(/[^a-z0-9\s-]/g, ' ') // Remove non-alphanumeric chars except hyphen
    .replace(/\s+/g, ' ').trim(); // Normalize whitespace
  
  // 2. Expanded Stopwords List
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'in', 'on', 'at', 'for', 'to', 'of', 'by', 'with', 'from', 'up', 'down', 'out', 'over', 'under',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
    'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'theirs', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
    'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'such', 'so', 'than', 'too', 'very', 'just', 'about', 'above', 'below', 'between', 'into', 'through', 'during', 'before', 'after',
    'or', 'if', 'then', 'but', 'yet', 'however', 'although', 'though', 'also', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'use', 'uses', 'using', 'used', 'make', 'makes', 'making', 'made', 'get', 'gets', 'getting', 'got', 'provide', 'provides', 'providing', 'provided', 'allow', 'allows', 'allowing', 'allowed',
    'based', 'via', 'within', 'without', 'new', 'different', 'various', 'multiple', 'single', 'certain', 'specific', 'general', 'potential', 'possible', 'example', 'like', 'such as'
  ]);
  
  // 3. Tokenize and filter stopwords and short words
  const words = cleanText.split(/\s+/).filter(word => 
    word.length > 2 && !stopwords.has(word) && !/^\d+$/.test(word) // Exclude numbers
  );
  
  // 4. Consolidate Keyword Recognition (Technical & Domain)
  const keywords = words.filter(word => 
    /^(algorithm|data|user|device|sensor|interface|system|platform|application|tech|model|network|learning|analysis|process|integration|solution|framework|architecture|design|software|hardware|api|database|cloud|storage|security|privacy|performance|scalability|auth|monitor|log|test|validate|deploy|infra|microservice|container|virtual|machine|robot|automation|ai|ml|vr|ar|xr|mr|iot|mobile|web|ui|ux|feedback|adaptive|real-time|track|recognition|visualiz|interact|blockchain|crypto|neural|deep|natural|language|computer|vision|speech|gesture|biometric|health|medical|biotech|fintech|edtech|transport|mobility|smart|city|sustainable|green|environ|energy|retail|ecommerce|social|media|content|stream|collab|productiv|gaming|entertain)$/i.test(word)
  );
  
  // 5. Improved Multi-word Phrase Identification
  const phrases: string[] = [];
  const potentialPhrases = new Set([
    'machine learning', 'deep learning', 'neural network', 'data science', 'big data', 'computer vision', 'natural language', 'user interface', 'user experience', 
    'real time', 'internet of things', 'cloud computing', 'mobile app', 'web application', 'smart device', 'social media', 'virtual reality', 'augmented reality', 
    'mixed reality', 'data analysis', 'data processing', 'data storage', 'user feedback', 'user authentication', 'api integration', 'smart city', 'smart home'
  ]);

  // Add phrases found directly in the text
  potentialPhrases.forEach(phrase => {
    if (cleanText.includes(phrase)) {
      phrases.push(phrase);
    }
  });

  // Identify adjacent non-stopword pairs (simple noun phrase approximation)
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i+1];
    // Avoid including already identified multi-word phrases
    const potentialPhrase = `${word1} ${word2}`; 
    if (!potentialPhrases.has(potentialPhrase)) {
       phrases.push(potentialPhrase); // Add potentially relevant adjacent words
    }
  }

  // 6. Combine candidates and Deduplicate
  const allCandidates = [
    ...keywords, 
    ...phrases
  ];
  const uniqueCandidates = [...new Set(allCandidates)];
  
  // 7. Enhanced Scoring
  const tagScores = uniqueCandidates.map(tag => {
    let score = 0;
    const regex = new RegExp('\\b' + tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi'); // Escape regex special chars
    const occurrences = (useCase.toLowerCase().match(regex) || []).length;
    
    if (occurrences === 0) return { tag, score: 0 }; // Skip if not found (can happen with phrase variations)

    // a. Frequency Score (logarithmic to reduce impact of very high counts)
    score += Math.log1p(occurrences) * 3;
    
    // b. Phrase Length Score (longer phrases are more specific)
    const wordCount = tag.split(/\s+/).length;
    score += wordCount * 4; // Increased weight for multi-word phrases
    
    // c. Weight for Core Technical/Domain Terms (Boost important concepts)
    if (wordCount === 1 && /^(ai|ml|vr|ar|iot|blockchain|neural|deep|vision|language|cloud|security|privacy|framework|platform|algorithm|model)$/i.test(tag)) {
      score += 6;
    } else if (wordCount > 1 && /learning|network|reality|computing|interface|experience|engine|platform|analysis|processing|integration|security|automation|recognition|visualization|interaction/i.test(tag)) {
       score += 5; // Boost important compound terms
    }
    
    // d. Penalize very generic single terms (unless part of a phrase)
    if (wordCount === 1 && /^(user|data|system|process|device|solution|application|design|test|tech)$/i.test(tag)) {
      score *= 0.6; // Reduce score for very common, less specific terms
    }
    
    return { tag, score };
  }).filter(item => item.score > 0); // Filter out zero-scored tags
  
  // 8. Sort by score and select top N tags
  const sortedTags = tagScores
    .sort((a, b) => b.score - a.score)
    .map(item => item.tag);
  
  // Return up to 10 tags
  return sortedTags.slice(0, 10);
};

/**
 * Custom hook for tag filtering and searching
 */
export const useTagFilter = (
  tagResults: TagResult[],
  initialQuery = '',
  initialTags: string[] = []
) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [filteredResults, setFilteredResults] = useState<TagResult[]>(tagResults);

  // Filter results based on search query and selected tags
  const filterResults = useCallback(() => {
    if (!tagResults.length) return;
    
    let filtered = [...tagResults];
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(result => 
        selectedTags.some(tag => result.tags.includes(tag))
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result => 
        result.title.toLowerCase().includes(query) || 
        result.useCase.toLowerCase().includes(query)
      );
    }
    
    setFilteredResults(filtered);
  }, [tagResults, searchQuery, selectedTags]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setFilteredResults(tagResults);
  }, [tagResults]);

  return {
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    filteredResults,
    filterResults,
    toggleTag,
    resetFilters
  };
};

export default {
  extractTagsFromUseCase,
  processInspirationBatch,
  useTagFilter
}; 