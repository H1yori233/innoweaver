'use client'

import { useState } from 'react'

import { fetchLikeSolution } from '@/lib/actions'

interface LikeButtonProps {
    isLiked: boolean
    solutionId: string
}

export function LikeButton({ isLiked: initialIsLiked, solutionId }: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLiked = async (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        setIsLoading(true)
        setError('')

        try {
            await fetchLikeSolution(solutionId)
            setIsLiked(!isLiked)
        } catch (err) {
            console.error('Error updating like status:', err)
            setError('Failed to update like status. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                className={`favorite-button ${isLiked ? 'liked' : 'not-liked'}`}
                onClick={handleLiked}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                disabled={isLoading}
            >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            {error && <p className="error-message">{error}</p>}
        </>
    )
}
