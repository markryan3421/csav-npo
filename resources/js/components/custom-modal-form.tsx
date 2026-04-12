import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { FieldProps } from "@headlessui/react"
import { CustomTextarea } from "./ui/custom-textarea"
// import { ButtonProps } from "@headlessui/react"
import InputError from './input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { LoaderCircle } from "lucide-react"
import { usePage } from "@inertiajs/react"
import { hasPermission } from "@/utils/authorization"
import { PermissionGuard } from "./permission-guard"

interface AddButtonProps {
    id: string,
    label: string,
    className: string,
    icon: string,
    type: 'button' | 'submit' | 'reset' | undefined,
    variant: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | undefined,
    permission?: string,
}

interface FieldProps {
    id: string;
    key: string;
    name: string;
    label: string;
    placeholder?: string;
    type: string;
    autocomplete?: string;
    tabIndex: number;
    autoFocus?: boolean;
    rows?: number;
    accept?: string;
    options?: { label: string, value: string, key: string }[];
}

interface ButtonProps {
    key: string,
    type: 'button' | 'submit' | 'reset' | undefined,
    label: string,
    variant: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | undefined,
    className: string,
}

interface Permissions {
    id: number;
    label: string;
    name: string;
    module: string;
    description: string;
}

interface FieldOptions {
    key: string;
    label: string;
    value: string;
}

interface ExtraData {
    [module: string]: Permissions[];
}

interface CustomModalFormProps {
    addButton: AddButtonProps;
    title: string;
    description: string;
    fields: FieldProps[];
    buttons: ButtonProps[];
    data: Record<string, any>;
    setData: (name: string, value: any) => void;
    processing: boolean;
    errors: Record<string, string>;
    handleSubmit: (data: any) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'view' | 'edit';
    previewImage?: string | null;
    extraData?: ExtraData;
}

export const CustomModalForm = ({
    addButton,
    title,
    description,
    fields,
    buttons,
    data,
    setData,
    errors,
    processing,
    handleSubmit,
    open,
    onOpenChange,
    mode = 'create',
    previewImage,
    extraData
}: CustomModalFormProps) => {
    // console.log("Extradata:", extraData);
    // console.log("Data permissions:", data.permissions);

    // Get user roles and permissions from Inertia page props
    const { auth } = usePage().props as any;
    const roles = auth.roles;
    const permissions = auth.permissions;

    // console.log(addButton.permission); // create-user
    // console.log(hasPermission(permissions, addButton.permission)); // create-user

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal>
            {/* {addButton.permission && hasPermission(permissions, addButton.permission) && ( */}
            <DialogTrigger asChild>
                <div className="grid grid-flow-col justify-items-end-safe mb-3">
                    <Button type={addButton.type} id={addButton.id} variant={addButton.variant} className={addButton.className}>
                        {addButton.icon && <addButton.icon />} {addButton.label}
                    </Button>
                </div>
            </DialogTrigger>
            {/* )} */}

            <DialogContent className="sm:max-w-[630px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-6 no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                        {fields.map((field) => {
                            const isHiddenPassword = field.type === 'password' && mode !== 'create';

                            if (isHiddenPassword) {
                                return null;
                            }

                            return (
                                <div key={field.key} className="grid gap-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    {field.type === 'textarea' ? (
                                        <CustomTextarea
                                            id={field.id}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            rows={field.rows}
                                            autoComplete={field.autocomplete}
                                            tabIndex={field.tabIndex}
                                            onChange={(e) => setData(field.name, e.target.value)}
                                            value={data[field.name] || ''}
                                            disabled={processing || mode === 'view'}
                                        />
                                    ) : field.type === 'file' ? (
                                        <div className="space-y-2">
                                            {/* Display the image in View mode */}
                                            {mode !== 'create' && previewImage && <img src={previewImage} alt={data?.[field.key]} className="h-32 w-32 object-cover rounded" />}

                                            {/* Input field for image */}
                                            {mode !== 'view' && (
                                                <Input
                                                    id={field.id}
                                                    name={field.name}
                                                    type='file'
                                                    accept={field.accept}
                                                    tabIndex={field.tabIndex}
                                                    onChange={(e) => setData(field.name, e.target.files ? e.target.files[0] : null)}
                                                    disabled={processing}
                                                />
                                            )}
                                        </div>
                                    ) : field.type === 'single-select' ? (
                                        <Select
                                            disabled={processing || mode === 'view'}
                                            value={
                                                // Handle array values for roles field
                                                field.name === 'roles' && Array.isArray(data[field.name])
                                                    ? data[field.name][0] || ''
                                                    : data[field.name] || ''
                                            }
                                            onValueChange={(value) => {
                                                // For roles field, store as array with single element
                                                if (field.name === 'roles') {
                                                    setData(field.name, [value]);
                                                } else {
                                                    setData(field.name, value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${field.label}`}>
                                                    {/* Special handling for roles */}
                                                    {field.name === 'roles' && Array.isArray(data[field.name])
                                                        ? data[field.name][0]
                                                        : data[field.name]}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(() => {
                                                    // Case 1: Options explicitly provided in field config
                                                    if (field.options && field.options.length > 0) {
                                                        return field.options;
                                                    }

                                                    // Case 2: Options from extraData
                                                    if (extraData?.[field.key]) {
                                                        return extraData[field.key].map((item: any) => ({
                                                            key: item.id?.toString() || Math.random().toString(),
                                                            value: item.name || item.value,
                                                            label: item.label || item.name || item.value,
                                                        }));
                                                    }

                                                    // Case 3: No options available
                                                    return [];
                                                })().map((option: FieldOptions) => (
                                                    <SelectItem key={option.key} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === 'grouped-checkboxes' ? (
                                        console.log('permissions in form:', data.permissions),
                                        <div className="space-y-2">
                                            {extraData &&
                                                Object.entries(extraData).map(([module, permissions]) => (
                                                    <div key={module} className="mb-4 border-b pb-5">
                                                        <h4 className="text-sm font-bold text-gray-700 capitalize">{module}</h4>
                                                        <div className="ms-4 mt-2 grid grid-cols-3 gap-2">
                                                            {permissions.map((permission) => (
                                                                <label key={permission.id} className="flex items-center gap-2 text-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        name={field.name}
                                                                        className="accent-primary"
                                                                        disabled={processing || mode === 'view'}
                                                                        value={permission.name}
                                                                        checked={data.permissions.includes(permission.name)}
                                                                        onChange={(e) => {
                                                                            const value = permission.name;
                                                                            const current = data.permissions || [];

                                                                            if (e.target.checked) {
                                                                                setData('permissions', [...current, value]);
                                                                            } else {
                                                                                setData(
                                                                                    'permissions',
                                                                                    current.filter((permission: string) => permission !== value),
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span>{permission.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <Input
                                            id={field.id}
                                            name={field.name}
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            autoComplete={field.autocomplete}
                                            tabIndex={field.tabIndex}
                                            autoFocus={field.autoFocus}
                                            onChange={(e) => setData(field.name, e.target.value)}
                                            value={data[field.name] || ''}
                                            disabled={processing || mode === 'view'}
                                        />
                                    )}

                                    {/* Form validation error message */}
                                    <InputError message={errors?.[field.name]} />
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        {buttons.map((button) => {
                            if (button.key === 'cancel') {
                                return (
                                    <DialogClose asChild key={button.key}>
                                        <Button key={button.key} type={button.type} variant={button.variant} className={button.className}>
                                            {button.label}
                                        </Button>
                                    </DialogClose>
                                );
                            } else if (mode !== 'view') {
                                return (
                                    <Button key={button.key} type={button.type} variant={button.variant} className={button.className}>
                                        {processing && <LoaderCircle className='h-4 w-4 animate-spin' />}
                                        {processing ? 'Saving...' : button.label}
                                    </Button>
                                );
                            }
                        })}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
