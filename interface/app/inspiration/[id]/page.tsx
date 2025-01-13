// inspiration/[id].tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MeiliSearch } from "meilisearch";
import { fetchQuerySolution, fetchQueryLikedSolutions, fetchLikeSolution } from "@/lib/actions";
import { FaHeart, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const useSolutionData = (id: string, client: MeiliSearch) => {
  const [solution, setSolution] = useState<any>(null);
  const [citedPapersDetails, setCitedPapersDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);  // Start with loading
  const [error, setError] = useState<string | null>(null);

  const fetchSolutionData = useCallback(async () => {
    const fetchPaperDetails = async (paperId: string) => {
      try {
        const index = client.index("paper_id");
        const searchResults = await index.search(paperId, { limit: 1 });
        return searchResults.hits.length > 0 ? searchResults.hits[0] : null;
      } catch (error) {
        console.error("Error fetching paper details:", error);
        return null;
      }
    };

    try {
      setLoading(true);
      const result = await fetchQuerySolution(id);
      setSolution(result);

      if (result?.cited_papers) {
        const papersDetails = await Promise.all(result.cited_papers.map(fetchPaperDetails));
        setCitedPapersDetails(papersDetails.filter((paper) => paper));
      }
      setLoading(false);
    } catch (err) {
      setError("Error fetching solution or cited papers");
      setLoading(false);
    }
  }, [client, id]);

  useEffect(() => {
    fetchSolutionData();
  }, [fetchSolutionData]);

  return { solution, citedPapersDetails, loading, error };
};

const CreatorInfo = ({ creator }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-secondary transition-transform transform hover:scale-105">
    <h2 className="text-xl font-semibold text-text-primary">Creator Info</h2>
    <div className="mt-4 text-text-secondary">
      <p><strong>Name:</strong> {creator.name}</p>
      <p><strong>Email:</strong> {creator.email}</p>
    </div>
    <h3 className="text-xl font-semibold text-text-primary mt-6">Creations</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {creator.creations.map((creation, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-md border border-secondary transition-transform transform hover:scale-105"
        >
          <h3 className="text-xl font-semibold text-text-primary">{creation.title}</h3>
          <p className="mt-2 text-text-secondary">{creation.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const Inspiration = () => {
  const apiUrl = "120.55.193.195:7700/";
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const client = useMemo(() => new MeiliSearch({ host: apiUrl }), [apiUrl]);
  const { solution, citedPapersDetails, loading, error } = useSolutionData(id as string, client);
  useEffect(() => {
    const initializeLikeStatus = async () => {
      try {
        const likedStatuses = await fetchQueryLikedSolutions([id as string]);
        const newLikedStates = likedStatuses.reduce((acc: any, { solution_id, isLiked }) => {
          acc[solution_id] = isLiked;
          return acc;
        }, {});
        setIsLiked(newLikedStates[id as string] || false);
      } catch (error) {
        console.error("Failed to fetch liked status", error);
      }
    };
    initializeLikeStatus();
  }, [id]);

  const handleLiked = useCallback(async () => {
    setIsLiked((prev) => !prev);
    await fetchLikeSolution(id as string);
  }, [id]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div
      className="flex flex-col ml-[12.5rem] items-center bg-primary 
          min-h-screen p-4 md:p-8 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-7xl rounded-lg overflow-hidden shadow-sm">
        <motion.div
          className="flex justify-between items-center p-6 border-b border-border-primary"
          {...fadeInUp}
        >
          <h1 className="text-2xl font-bold text-text-primary">
            {loading ? "Loading..." : solution?.solution?.Title || "No Title"}
          </h1>
          <motion.button
            className={`text-3xl transition-colors duration-200 ${isLiked ? "text-red-500" : "text-gray-400"}`}
            onClick={handleLiked}
            aria-label={isLiked ? "Dislike" : "Like"}
            disabled={loading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaHeart />
          </motion.button>
        </motion.div>

        <motion.div className="p-6 space-y-8" {...fadeInUp}>
          {loading ? (
            <div className="text-text-secondary text-center">Loading...</div>
          ) : (
            <>
              <motion.div className="flex flex-col md:flex-row gap-8" {...fadeInUp}>
                <div className="md:w-1/3 flex items-center">
                  {solution?.solution?.image_url ? (
                    <img
                      src={solution.solution.image_url}
                      alt={solution.solution.Title || "Solution Image"}
                      className="rounded-lg w-full h-auto object-cover shadow-md"
                    />
                  ) : (
                    <div className="bg-gray-200 rounded-lg w-full h-48 flex items-center justify-center text-text-secondary">
                      No Image
                    </div>
                  )}
                </div>
                <div className="md:w-2/3 space-y-4">
                  <InfoSection title="Query" content={solution?.query} />
                  <InfoSection title="Function" content={solution?.solution?.Function} />
                  <InfoSection title="Use Case" content={solution?.solution?.["Use Case"]} />
                </div>
              </motion.div>

              <motion.div {...fadeInUp}>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Iterations</h2>
                <IterationSection
                  title="Original"
                  method={solution?.solution?.["Technical Method"]?.Original}
                  performance={solution?.solution?.["Possible Results"]?.Original?.Performance}
                  userExperience={solution?.solution?.["Possible Results"]?.Original?.["User Experience"]}
                  isExpanded={expandedSection === "Original"}
                  onToggle={() => toggleSection("Original")}
                />
                {solution?.solution?.["Technical Method"]?.Iteration?.map((iteration: string, index: number) => (
                  <IterationSection
                    key={index}
                    title={`Iteration ${index + 1}`}
                    method={iteration}
                    performance={solution?.solution?.["Possible Results"]?.Iteration?.[index]?.Performance}
                    userExperience={solution?.solution?.["Possible Results"]?.Iteration?.[index]?.["User Experience"]}
                    isExpanded={expandedSection === `Iteration${index}`}
                    onToggle={() => toggleSection(`Iteration${index}`)}
                  />
                ))}
              </motion.div>

              <motion.div {...fadeInUp}>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Cited Papers</h2>
                {citedPapersDetails.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {citedPapersDetails.map((paperDetail, index) => (
                      <motion.li
                        key={index}
                        className="text-blue-500 hover:underline cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                      >
                        {paperDetail["_id"]}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-secondary">No Cited Papers</p>
                )}
              </motion.div>

              <motion.div {...fadeInUp}>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Creator</h2>
                <CreatorInfo
                  creator={{
                    name: solution?.solution?.Creator?.Name || "Unknown Creator",
                    email: solution?.solution?.Creator?.Email || "unknown@example.com",
                    creations: [
                      { title: 'Creation 1', description: 'This is the first creation.' },
                      { title: 'Creation 2', description: 'This is the second creation.' },
                      { title: 'Creation 3', description: 'This is the third creation.' },
                    ],
                  }}
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const InfoSection = ({ title, content }: { title: string; content: string }) => (
  <div>
    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
    <p className="text-text-secondary">{content || `No ${title}`}</p>
  </div>
);

const IterationSection = ({
  title,
  method,
  performance,
  userExperience,
  isExpanded,
  onToggle
}: {
  title: string;
  method: string;
  performance: string;
  userExperience: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div className="mb-4 bg-primary rounded-lg shadow-sm">
    <motion.button
      className="flex justify-between items-center w-full p-4 text-left"
      onClick={onToggle}
      whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
    >
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <FaChevronDown className="text-text-secondary" />
      </motion.div>
    </motion.button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="p-4 space-y-2">
            <p className="text-text-secondary">{method}</p>
            <p className="text-text-secondary">
              <span className="font-semibold">Performance:</span> {performance}
            </p>
            <p className="text-text-secondary">
              <span className="font-semibold">User Experience:</span> {userExperience}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default Inspiration;