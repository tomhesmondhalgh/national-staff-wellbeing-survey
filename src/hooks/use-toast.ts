
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  [key: string]: any;
};

// Enhanced toast function that matches the expected interface
export const toast = (props: ToastProps) => {
  const { title, description, variant, duration, ...rest } = props;
  
  // Handle destructive variant (errors)
  if (variant === "destructive") {
    return sonnerToast.error(title || 'Error', {
      description,
      duration: duration || 5000,
      ...rest
    });
  }
  
  // Use success variant for non-destructive
  return sonnerToast.success(title || 'Success', {
    description,
    duration: duration || 5000,
    ...rest
  });
};

// Export a compatible useToast hook interface
export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: []
  };
};
