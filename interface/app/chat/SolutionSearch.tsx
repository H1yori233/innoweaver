"use client"

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import MeiliSearch from "meilisearch";
import JsonViewer from "@/components/inspiration/JsonViewer";
import debounce from 'lodash/debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

const SolutionSearch = ({ onSelectionChange }) => {
  const apiUrl = '120.55.193.195:7700/';
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSolutions, setSelectedSolutions] = useState([]);

  const scrollContainerRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const stableOnSelectionChange = useCallback(
    (ids: string[]) => {
      if (onSelectionChange) {
        onSelectionChange(ids);
      }
    },
    [onSelectionChange]
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const fetchSolutions = useCallback(
    async (searchQuery = "", pageNumber = 1) => {
      if (!searchQuery.trim()) {
        if (pageNumber === 1) setSolutions([]);
        setHasMore(false);
        return;
      }

      setLoading(true);
      try {
        const client = new MeiliSearch({ host: apiUrl });
        const index = client.index("solution_id");
        const searchResults = await index.search(searchQuery, {
          offset: (pageNumber - 1) * 10,
          limit: 10,
        });
        setSolutions((prev) =>
          pageNumber === 1 ? searchResults.hits : [...prev, ...searchResults.hits]
        );
        setHasMore(searchResults.hits.length > 0);
      } catch (error) {
        console.error("Error fetching solutions:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setQuery(value);
      setPage(1);
      fetchSolutions(value, 1);
    }, 300),
    [fetchSolutions]
  );

  const toggleSolutionSelection = useCallback(
    (solutionId: string) => {
      setSelectedSolutions((prevSelected) => {
        const isSelected = prevSelected.includes(solutionId);

        // 如果已经选中，则移除
        if (isSelected) {
          const updatedSelection = prevSelected.filter((id) => id !== solutionId);
          stableOnSelectionChange(updatedSelection);
          return updatedSelection;
        }

        // 如果未选中且已达到上限，则不添加
        if (prevSelected.length >= 8) {
          alert('最多只能选择 8 条 inspiration');
          return prevSelected;
        }

        // 未选中且未达到上限，则添加
        const updatedSelection = [...prevSelected, solutionId];
        stableOnSelectionChange(updatedSelection);
        return updatedSelection;
      });
    },
    [stableOnSelectionChange]
  );

  const isSolutionSelected = (solutionId) => selectedSolutions.includes(solutionId);


  const handleScroll = useCallback(() => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
      scrollContainerRef.current.scrollHeight - 5
    ) {
      if (!loading && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) fetchSolutions(query, page);
  }, [page, fetchSolutions, query]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',');
      setSelectedSolutions(idArray);
      stableOnSelectionChange(idArray);

      // 预加载选中的解决方案数据
      idArray.forEach(async (id) => {
        try {
          const client = new MeiliSearch({ host: apiUrl });
          const index = client.index("solution_id");
          const result = await index.getDocument(id);
          setSolutions(prev => {
            if (!prev.find(sol => sol._id === id)) {
              return [...prev, result];
            }
            return prev;
          });
        } catch (error) {
          console.error(`Error fetching solution ${id}:`, error);
        }
      });
    }
  }, [searchParams, apiUrl]);

  return (
    <div
      className="flex flex-col md:flex-row items-start justify-center 
        w-full h-full max-w-6xl bg-primary px-6 py-2 rounded-lg shadow-lg gap-2"
    >
      <div className="flex flex-col items-center w-full md:w-2/3 h-full space-y-4 mt-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-placeholder">
            <FaSearch />
          </span>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-1 text-lg border border-border-primary 
              rounded-lg bg-primary text-text-primary outline-none shadow 
              focus:ring focus:ring-border-secondary focus:border-border-secondary transition-all duration-300"
            placeholder="Search inspirations..."
            onChange={handleSearch}
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          <motion.div
            ref={scrollContainerRef}
            className="w-full flex-1 overflow-y-auto bg-primary rounded-lg space-y-3 p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {query.trim() === "" ? (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-text-placeholder text-center"
              >
                Please enter a search term to begin.
              </motion.p>
            ) : loading && page === 1 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center items-center h-full"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary"></div>
              </motion.div>
            ) : solutions.length === 0 ? (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-text-placeholder text-center"
              >
                No results found for "{query}".
              </motion.p>
            ) : (
              <AnimatePresence>
                {solutions.map((solution, index) => (
                  <motion.div
                    key={solution["_id"]}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`px-2 rounded-lg bg-primary transition duration-300 ease-in-out`}
                  >
                    <JsonViewer
                      jsonData={solution}
                      isSelectable={true}
                      isSelected={isSolutionSelected(solution["_id"])}
                      onSelect={() => toggleSolutionSelection(solution["_id"])}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {loading && page > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-4"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-primary"></div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {!loading && !hasMore && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-sm text-text-placeholder text-center mt-4"
          >
            No more inspirations to load
          </motion.p>
        )}
      </div>

      <motion.div
        className="w-full md:w-1/3 h-full flex flex-col rounded-lg shadow-md p-4 ml-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-text-primary font-semibold text-lg mb-4">
          Selected Inspirations ({selectedSolutions.length}/8)
        </h3>
        <AnimatePresence>
          {selectedSolutions.length > 0 ? (
            <motion.ul className="text-text-secondary space-y-2 overflow-y-auto">
              {selectedSolutions.map((id) => (
                <motion.li
                  key={id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-sm cursor-pointer hover:text-accent-red transition"
                  onClick={() => toggleSolutionSelection(id)}
                >
                  {id}
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-text-placeholder"
            >
              No inspirations selected.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SolutionSearch;

