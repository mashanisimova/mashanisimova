// Adapted from https://ui.shadcn.com
import { useEffect, useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

export type ToastActionElement = React.ReactElement

export type Toast = {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type UseToast = {
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (toastId?: string) => void
  toasts: Toast[]
}

export const useToast = (): UseToast => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return () => {
      // Cleanup toasts when unmounting
      setToasts([])
    }
  }, [])

  const toast = ({ ...props }: Omit<Toast, "id">) => {
    const id = genId()

    setToasts((prevToasts) => {
      const newToast = {
        ...props,
        id,
      }
      
      const updatedToasts = [
        ...prevToasts,
        newToast,
      ].slice(-TOAST_LIMIT)

      return updatedToasts
    })

    // Auto-dismiss after a delay
    setTimeout(() => {
      dismiss(id)
    }, TOAST_REMOVE_DELAY)

    return id
  }

  const dismiss = (toastId?: string) => {
    setToasts((prevToasts) => {
      if (toastId) {
        return prevToasts.filter((toast) => toast.id !== toastId)
      }
      return []
    })
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}
