"use client"

import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, title, description, variant }) => (
        <Toast
          key={id}
          variant={variant}
          title={title}
          description={description}
        />
      ))}
    </>
  )
}
