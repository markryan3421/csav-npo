import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to handle open state changes (e.g., onClose) */
    onOpenChange: (open: boolean) => void;
    /** The name of the item being deleted – shown in the description */
    itemName: string;
    /** Function to call when deletion is confirmed */
    onConfirm: () => void;
    /** Optional custom title (default: "Delete item") */
    title?: string;
    /** Optional custom description (default: "Are you sure you want to delete {itemName}? This action cannot be undone.") */
    description?: string;
    /** Optional text for the confirm button (default: "Delete") */
    confirmText?: string;
    /** Optional text for the cancel button (default: "Cancel") */
    cancelText?: string;
    /** Whether the delete action is in progress – shows a spinner and disables the button */
    isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    title = 'Delete item',
    description = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isDeleting = false,
}: DeleteConfirmationDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        // The dialog will close automatically after onConfirm if the parent sets open={false}
        // You can also choose to keep it open if there's an error, but we'll let the parent control it.
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isDeleting}>
                            {cancelText}
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}