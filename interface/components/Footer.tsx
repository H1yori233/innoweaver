'use client';

import React from 'react';
import { FaGithub, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-secondary py-4 w-full">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Left - Copyright info */}
          <div className="text-text-secondary text-xs">
            <p>© 2024 InnoWeaver. All rights reserved.</p>
            <p>Version 1.0.3</p>
          </div>

          {/* Center - Links */}
          <div className="flex flex-col items-center text-xs">
            <div className="text-text-secondary space-x-4">
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
            <div className="text-text-secondary mt-1">
              <span>Made with ❤️ by InnoWeaver Team</span>
            </div>
          </div>

          {/* Right - Social links */}
          <div className="flex justify-end space-x-4">
            <a
              href="https://github.com/yourusername/innoweaver"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <a
              href="mailto:contact@innoweaver.com"
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Email"
            >
              <FaEnvelope size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
