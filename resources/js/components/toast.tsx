import { toast } from "sonner";
import { Toaster } from "./ui/sonner";

export const showToast = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
    loading: (message: string) => toast.loading(message),
};

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            duration={4000}
            richColors
        />
    );
}