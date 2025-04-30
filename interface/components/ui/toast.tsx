'use client'

import { createContext, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { logger } from '@/lib/logger'

interface ToastContextType {
  toast: (props: ToastProps) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProps {
  title: string
  description: string
  type?: 'default' | 'error' | 'warning'
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([])

  const toast = (props: ToastProps) => {
    const id = Date.now()
    setToasts((prevToasts) => [...prevToasts, { ...props, id, type: props.type || 'default' }])
    logger.log(props)

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 3000)
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-primary text-text-primary'
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-6 z-50">
        <div className="flex flex-col items-end gap-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className={cn(
                  "shadow-lg rounded-lg p-4 mb-2 max-w-md w-full",
                  getToastStyles(toast.type)
                )}
              >
                <h3 className="font-semibold">{toast.title}</h3>
                <p className={cn(
                  "text-sm mt-1",
                  toast.type === 'warning' ? 'text-black/80' : 'text-text-secondary'
                )}>
                  {toast.description}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}

