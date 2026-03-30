import toast, { Toaster } from 'react-hot-toast';

export const showToast = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast(message),
    loading: (message: string) => toast.loading(message),
};

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 5000,
                style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '12px 16px',
                },
                success: {
                    style: {
                        background: '#10b981',
                    },
                },
                error: {
                    style: {
                        background: '#ef4444',
                    },
                },
            }}
        />
    );
}