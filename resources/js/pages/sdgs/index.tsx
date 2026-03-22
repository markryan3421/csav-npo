import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CustomToast } from '@/components/custom-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoalController from '@/actions/App/Http/Controllers/GoalController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SDG Management',
        href: '/sdg',
    },
];

export default function Index() {
    return (
        <p>Sdg Index</p>
    );
}
