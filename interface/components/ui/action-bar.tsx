import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionbarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  buttons: Array<{
    text: string;
    onClick: () => void;
  }>;
}

const Actionbar: React.FC<ActionbarProps> = ({ isOpen, onClose, title, buttons }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black dark:bg-white bg-opacity-50 dark:bg-opacity-30
            flex items-end justify-center sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-primary rounded-t-lg sm:rounded-lg p-6 w-full max-w-sm relative"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
              title="Close dialog"
              aria-label="Close dialog"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">{title}</h2>
            <div className="space-y-2">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className="w-full px-4 py-2 rounded-md text-center text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  {button.text}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Actionbar;
