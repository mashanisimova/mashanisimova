"use client"

import * as React from "react"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
  title?: string
  description?: string
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, variant = "default", title, description, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`fixed bottom-4 right-4 rounded-md border p-4 shadow-md ${variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900"} max-w-md z-50`}
      {...props}
    >
      {title && <div className="font-medium">{title}</div>}
      {description && <div className="mt-1 text-sm">{description}</div>}
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast }
