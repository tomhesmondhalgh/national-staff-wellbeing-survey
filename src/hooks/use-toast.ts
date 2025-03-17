
import { toast } from "sonner";

// Re-export the toast function from sonner
export { toast };

// For backwards compatibility, provide a useToast function that wraps sonner's toast
export const useToast = () => {
  return {
    toast,
    dismiss: () => {},
    toasts: []
  };
};
