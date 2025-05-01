"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"

const TOAST_TIMEOUT = 5000

type ToastVariant = "default" | "destructive"

interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface Toast extends ToastProps {
  id: string
  visible: boolean
}

type ToasterToast = Toast

const ToastContext = createContext<{
  toast: (props: ToastProps) => void
  toasts: ToasterToast[]
}>({
  toast: () => {},
  toasts: [],
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const toast = ({ title, description, variant = "default", duration = TOAST_TIMEOUT }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      visible: true,
      duration,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) => {
          if (toast.id === id) {
            return { ...toast, visible: false }
          }
          return toast
        }),
      )
    }, duration)

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration + 300)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setToasts((prevToasts) =>
        prevToasts.filter((toast) => {
          if (!toast.visible) {
            return false
          }
          return true
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <ToastContext.Provider value={{ toast, toasts }}>{children}</ToastContext.Provider>
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export type { ToastProps }
