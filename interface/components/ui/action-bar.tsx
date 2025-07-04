import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <X size={20} />
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

