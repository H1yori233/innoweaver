"use client";

import React, { useState, useEffect } from 'react';
import { fetchViewPrompts, fetchModifyPrompt } from '@/lib/actions/loadActions';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

interface Prompt {
  name: string;
  content: string;
}

const initialPrompts: Prompt[] = [
];

const PromptManager: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadPrompts() {
      try {
        const fetchedPrompts = await fetchViewPrompts();
        const mergedPrompts = [...initialPrompts];
        Object.entries(fetchedPrompts).forEach(([name, content]) => {
          if (!mergedPrompts.some(p => p.name === name)) {
            mergedPrompts.push({ name, content: content as string });
          }
        });
        setPrompts(mergedPrompts);
      } catch (error) {
        console.error("Error fetching prompts:", error);
      }
    }

    loadPrompts();
  }, []);

  const formatPromptName = (prompt: string) => {
    return prompt.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const updatePrompt = async (promptName: string, newContent: string) => {
    try {
      await fetchModifyPrompt(promptName, newContent);
      setPrompts(prevPrompts => 
        prevPrompts.map(p => 
          p.name === promptName ? { ...p, content: newContent } : p
        )
      );
      toast({ 
        title: "Prompt Updated", 
        description: "The prompt has been successfully updated." 
      });
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast({ 
        title: "Update Failed", 
        description: "Failed to update the prompt. Please try again." 
      });
    }
  };

  const togglePrompt = (promptName: string) => {
    setExpandedPrompt(expandedPrompt === promptName ? null : promptName);
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 px-6 bg-background rounded-lg shadow-lg text-text-primary">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Manage Backend Prompts</h2>
      <Input
        type="text"
        placeholder="Search prompts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="space-y-4">
        {filteredPrompts.map((prompt) => (
          <motion.div
            key={prompt.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card p-2 rounded-lg shadow-md overflow-hidden"
          >
            <motion.div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => togglePrompt(prompt.name)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <h3 className="text-lg font-semibold text-card-foreground">
                {formatPromptName(prompt.name)}
              </h3>
              <motion.div
                animate={{ rotate: expandedPrompt === prompt.name ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown />
              </motion.div>
            </motion.div>
            <AnimatePresence initial={false}>
              {expandedPrompt === prompt.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: "auto", 
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.3,
                        ease: "easeOut"
                      },
                      opacity: {
                        duration: 0.2,
                        delay: 0.1
                      }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: {
                      height: {
                        duration: 0.3,
                        ease: "easeIn"
                      },
                      opacity: {
                        duration: 0.2
                      }
                    }
                  }}
                  className="mt-4"
                >
                  <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    exit={{ y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PromptEditor
                      initialContent={prompt.content}
                      onSave={(newContent) => updatePrompt(prompt.name, newContent)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface PromptEditorProps {
  initialContent: string;
  onSave: (newContent: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full h-128 p-2 border rounded-md"
      />
      <Button onClick={handleSave} className="w-full">
        Update
      </Button>
    </div>
  );
};

export default PromptManager;

