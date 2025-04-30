import React, { useState, useEffect, useCallback } from 'react';
import './MiniCard.css';
import { GetColor, useThemeColor } from '@/lib/hooks/color';
import useRouterHook from '@/lib/hooks/router-hook';
import Link from 'next/link';
import { fetchLikeSolution } from '@/lib/actions';
import { FaHeart } from 'react-icons/fa';
import { getLargeEmojiForTitle } from '@/lib/emoji-utils';
import { logger } from '@/lib/logger';
import Image from 'next/image';

const MiniCard = React.memo(function MiniCard(props: { content: any, index: number, isLiked: boolean }) {
    const { routes } = useRouterHook();
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [titleEmoji, setTitleEmoji] = useState<string>('📄');
    
    const cardColor = useThemeColor(props.index, 30);
    const isDarkTheme = typeof document !== 'undefined' ? 
        document.documentElement.classList.contains('dark') : false;

    const hasImage = props.content.solution?.image_url && !imageError;

    useEffect(() => {
        setIsLiked(props.isLiked);
    }, [props.isLiked]);

    useEffect(() => {
        const title = props.content.solution?.Title || 'Untitled';
        const emoji = getLargeEmojiForTitle(title);
        setTitleEmoji(emoji);
        logger.log(`标题 "${title}" 匹配表情符号: ${emoji}`);
    }, [props.content.solution?.Title]);

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
    }, []);

    // 获取标题显示内容
    const title = props.content.solution?.Title || 'Untitled Title';
    
    return (
        <div className="mini-card-container">
            <Link
                href={`/inspiration/${props.content.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`card ${hasImage ? 'has-image' : ''}`}
                style={{
                    backgroundColor: cardColor,
                    boxShadow: isDarkTheme 
                        ? '0 6px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)' 
                        : '0 6px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.3s ease',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: isDarkTheme 
                        ? '1px solid rgba(255, 255, 255, 0.08)' 
                        : '1px solid rgba(0, 0, 0, 0.03)'
                }}
                aria-label={`View solution ${title}`}
            >
                {hasImage && (
                    <div className="card-image-container">
                        <Image
                            src={props.content.solution.image_url}
                            alt={title}
                            fill
                            sizes="100%"
                            className="card-image"
                            onError={handleImageError}
                            style={{ objectFit: 'cover', opacity: 0.6 }}
                        />
                    </div>
                )}
                
                <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center p-4 z-10">
                    <div className="w-full h-full flex flex-col justify-center items-center">
                        {/* 暂时隐藏 Emoji 
                        <div 
                            className="emoji-container flex items-center justify-center mb-4"
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <span 
                                className="text-7xl filter drop-shadow-lg"
                                aria-label={`Icon representing ${title}`}
                                style={{
                                    transform: 'scale(1.2)',
                                    transition: 'transform 0.3s ease',
                                }}
                            >
                                {titleEmoji}
                            </span>
                        </div>
                        */}
                        
                        <span 
                            className="title-text text-2xl font-bold break-words line-clamp-3 text-center mt-2"
                            style={{
                                color: 'rgba(255, 255, 255, 0.95)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
                                fontWeight: '600',
                                letterSpacing: '-0.01em',
                                maxWidth: '90%',
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            {title}
                        </span>
                    </div>
                </div>

                <button
                    className="favorite-button"
                    style={{
                        color: isLiked ? (isDarkTheme ? '#F06595' : '#E64980') : 'rgba(255, 255, 255, 0.7)',
                        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
                        transition: 'all 0.2s ease',
                        transform: isLiked ? 'scale(1.08)' : 'scale(1)'
                    }}
                    onClick={handleLiked}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    disabled={isLoading}
                >
                    <FaHeart />
                </button>

                <div className="content" style={{ display: 'none' }}>
                    <h2 className="function">
                        {title}
                    </h2>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </Link>
        </div>
    );
});

export default MiniCard;
MiniCard.whyDidYouRender = true;
