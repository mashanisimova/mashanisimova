// Import hooks from the shadcn/ui toast component
import { useToast as useShadcnToast } from "@/components/ui/use-toast";

// Re-export the hook with the same name
export const useToast = useShadcnToast;