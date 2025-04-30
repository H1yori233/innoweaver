"use client";

import { useState, useEffect } from 'react';
import { fetchLoadLikedSolutions } from "@/lib/actions";
import GalleryPage from '@/components/inspiration/GalleryPage';
import { motion } from 'framer-motion';

const FavList = () => {
    const [id, setId] = useState('');

    useEffect(() => {
        const storedId = localStorage.getItem("id");
        if (storedId) {
            setId(storedId);
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center bg-primary text-text-primary font-sans min-h-full transition-colors duration-300"
            style={{ height: '100vh' }}>
            <GalleryPage title="My Favorite" fetchData={fetchLoadLikedSolutions} />
        </motion.div>
    );
};

export default FavList;
