import React, { useState, useEffect, useCallback } from 'react';
import useRouterHook from '@/lib/hooks/router-hook';
import Link from 'next/link';
import { fetchLikeSolution } from '@/lib/actions';
import { FaHeart } from 'react-icons/fa';
import { logger } from '@/lib/logger';
import Image from 'next/image';

const MiniCard = React.memo(function MiniCard(props: { content: any, index: number, isLiked: boolean }) {
    const { routes } = useRouterHook();
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState<boolean>(false);
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const title = props.content.solution?.Title || 'Untitled Title';
    const functionName = props.content.solution?.Function || title;
    const hasImage = props.content.solution?.image_url && !imageError;

    // Clean heritage colors - separate for light/dark
    const generateHeritageColor = () => {
        const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const lightColors = [
            'from-surface-elevated to-surface-secondary',
            'from-organic-sage/20 to-organic-moss/10',
            'from-organic-clay/20 to-organic-sand/15',
            'from-organic-rust/15 to-organic-clay/10',
            'from-stone/50 to-ash/30',
            'from-organic-storm/20 to-organic-moss/15',
        ];
        const darkColors = [
            'from-surface-secondary to-surface-tertiary',
            'from-organic-sage/10 to-surface-secondary',
            'from-organic-clay/10 to-surface-secondary',
            'from-organic-rust/8 to-surface-secondary',
            'from-surface-elevated to-surface-secondary',
            'from-organic-storm/10 to-surface-secondary',
        ];

        const isDark = document.documentElement.classList.contains('dark');
        const colors = isDark ? darkColors : lightColors;
        return colors[Math.abs(hash) % colors.length];
    };

    const cardGradient = generateHeritageColor();

    useEffect(() => {
        setIsLiked(props.isLiked);
    }, [props.isLiked]);

    const handleLiked = async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);
        setIsLoading(true);
        setError('');

        try {
            const result = await fetchLikeSolution(props.content.id);
            logger.log(result);
        } catch (err) {
            logger.error('Error updating like status:', err);
            setIsLiked(!newLikeStatus);
            setError('Failed to update like status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageError = useCallback(() => {
        setImageError(true);
        setImageLoaded(false);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    return (
        <Link
            href={`/inspiration/${props.content.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block mb-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            aria-label={`View solution ${title}`}
        >
            <article className={`
                relative w-64 h-96 bg-gradient-to-br ${cardGradient}
                border border-border-subtle hover:border-accent-primary/20
                transition-all duration-300 overflow-hidden
                hover:shadow-lg hover:shadow-accent-primary/5
                dark:hover:shadow-none dark:hover:border-accent-primary/30
            `}
                style={{
                    borderRadius: '20px',
                    // Clean elevation for dark mode
                    boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
                }}
                onMouseEnter={(e) => {
                    const isDark = document.documentElement.classList.contains('dark');
                    if (isDark) {
                        e.currentTarget.style.setProperty('--card-shadow', '0 0 0 1px rgba(255, 255, 255, 0.1)');
                    } else {
                        e.currentTarget.style.setProperty('--card-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.1)');
                    }
                }}
                onMouseLeave={(e) => {
                    const isDark = document.documentElement.classList.contains('dark');
                    if (isDark) {
                        e.currentTarget.style.setProperty('--card-shadow', 'none');
                    } else {
                        e.currentTarget.style.setProperty('--card-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
                    }
                }}>

                {/* Image Section - Top 1/3 when image exists */}
                {hasImage && (
                    <div className="relative h-32 overflow-hidden">
                        <Image
                            src={props.content.solution.image_url}
                            alt={title}
                            fill
                            sizes="320px"
                            className={`object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                            priority={props.index < 4}
                            loading={props.index < 4 ? 'eager' : 'lazy'}
                            quality={80}
                        />

                        {/* Image overlay for depth */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-elevated/20" />
                    </div>
                )}

                {/* Content Section - Bottom 2/3 or full height */}
                <div className={`
                    relative flex flex-col justify-center p-6
                    ${hasImage ? 'h-64' : 'h-full'}
                `}>

                    {/* Title - using Display font */}
                    <h3 className="font-display text-xl font-medium text-text-primary leading-tight mb-3 line-clamp-3 group-hover:text-accent-primary transition-colors duration-200">
                        {title}
                    </h3>

                    {/* Function/Description - using Serif font */}
                    <p className="font-serif text-sm text-text-secondary leading-relaxed line-clamp-4 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                        {functionName}
                    </p>

                    {/* Heritage accent line - adaptive */}
                    <div className="absolute bottom-6 left-6 w-8 h-0.5 bg-accent-primary/40 group-hover:w-12 group-hover:bg-accent-primary/60 transition-all duration-300 dark:bg-accent-primary/30 dark:group-hover:bg-accent-primary/50" />
                </div>

                {/* Like Button - minimal and direct */}
                <button
                    className={`
                        absolute top-3 right-3 p-3 transition-all duration-200 z-10
                        ${isLiked
                            ? 'text-error hover:text-error/80 hover:scale-105'
                            : 'text-surface-elevated/90 hover:text-surface-elevated hover:scale-105 dark:text-text-inverse/70 dark:hover:text-text-inverse'
                        }
                        drop-shadow-md hover:drop-shadow-lg touch-target
                    `}
                    onClick={handleLiked}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                    <FaHeart className="w-6 h-6" />
                </button>

                {/* Loading state */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated/20 backdrop-blur-sm rounded-[20px]">
                        <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="absolute bottom-2 left-2 right-2 p-2 bg-error/10 border border-error/20 rounded-lg">
                        <p className="text-xs text-error">{error}</p>
                    </div>
                )}
            </article>
        </Link>
    );
});

export default MiniCard;
