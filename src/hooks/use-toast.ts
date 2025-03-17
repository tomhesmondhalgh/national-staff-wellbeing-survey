
import { toast as sonnerToast } from "sonner";

// Enhanced toast function that matches the expected interface
export const toast = (props: {
  title?: string; 
  description?: string; 
  variant?: "default" | "destructive";
  [key: string]: any;
}) => {
  if (props.variant === "destructive") {
    return sonnerToast.error(props.title, {
      description: props.description
    });
  }
  return sonnerToast(props.title, {
    description: props.description
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
