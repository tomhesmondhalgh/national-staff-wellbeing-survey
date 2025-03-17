
import { toast } from "sonner";

// Re-export the toast from sonner only
export { toast };

// For backwards compatibility, provide an empty useToast function
export const useToast = () => {
  return {
    toast,
    dismiss: () => {},
    toasts: []
  };
};
