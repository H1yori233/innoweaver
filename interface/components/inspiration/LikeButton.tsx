'use client'

import { useState } from 'react'
import { FaHeart } from 'react-icons/fa'
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
                className="favorite-button"
                style={{
                    color: isLiked ? '#ff6961' : '#BBBBBB',
                }}
                onClick={handleLiked}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                disabled={isLoading}
            >
                <FaHeart />
            </button>
            {error && <p className="error-message">{error}</p>}
        </>
    )
}

