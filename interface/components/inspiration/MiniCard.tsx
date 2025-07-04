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
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const cardColor = useThemeColor(props.index, 25);
    const isDarkTheme = typeof document !== 'undefined' ?
        document.documentElement.classList.contains('dark') : false;

    const hasImage = props.content.solution?.image_url && !imageError;

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

    // 获取标题显示内容
    const title = props.content.solution?.Title || 'Untitled Title';
    // 获取功能显示内容
    const functionName = props.content.solution?.Function || title;

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
                {/* 渐变叠加层 */}
                <div className="card-gradient-overlay"></div>

                {/* 背景图片 */}
                {props.content.solution?.image_url && (
                    <div className="card-image-container">
                        {!imageError ? (
                            <Image
                                src={props.content.solution.image_url}
                                alt={title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1600px) 33vw, 320px"
                                className={`card-image transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                style={{ objectFit: 'cover' }}
                                priority={props.index < 4} // 只有前4张图片优先加载
                                loading={props.index < 4 ? 'eager' : 'lazy'} // 明确指定加载策略
                                quality={75} // 降低图片质量以提升加载速度
                                placeholder="blur" // 添加模糊占位符
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj5m4xVvEH1Toi/d1a7zLLdN2eH2lAqNdwjlm2VfUH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj5m4xVvEH1Toi/d1a7zLLdN2eH2lAqNdwjlm2VfUH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj5m4xVvEH1Toi/d1a7zLLdN2eH2lAqNdwjlm2VfU//2Q=="
                            />
                        ) : (
                            // 图片加载失败时的占位符
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                <div className="text-gray-500 dark:text-gray-400 text-4xl">🖼️</div>
                            </div>
                        )}
                    </div>
                )}

                {/* 主要内容区域 - 默认只显示标题 */}
                <div className="card-content-wrapper">
                    <div className="w-full h-full flex flex-col justify-center items-center relative">
                        {/* 标题文本 */}
                        <h3
                            className="title-text text-xl md:text-2xl font-bold break-words line-clamp-4 text-center px-2"
                            style={{
                                color: 'rgba(255, 255, 255, 0.95)',
                                maxWidth: '90%',
                            }}
                        >
                            {title}
                        </h3>
                    </div>
                </div>

                {/* 点赞按钮 */}
                <button
                    className={`favorite-button ${isLiked ? 'liked' : ''}`}
                    onClick={handleLiked}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    disabled={isLoading}
                    style={{
                        opacity: isLoading ? 0.6 : 1,
                    }}
                >
                    <FaHeart />
                </button>

                {/* 悬停时显示的详细内容 - 只显示 function */}
                <div className="content">
                    <div className="w-full h-full flex flex-col justify-center items-center px-4">
                        <p className="function font-medium text-center leading-relaxed">
                            {functionName}
                        </p>

                        {error && <p className="error-message mt-2">{error}</p>}
                    </div>
                </div>

                {/* 加载状态指示器 */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 rounded-xl">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </Link>
        </div>
    );
});

export default MiniCard;
MiniCard.whyDidYouRender = true;
