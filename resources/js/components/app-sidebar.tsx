import { Link } from '@inertiajs/react';
import { Airplay, CircleMinus, CircleUser, Flag, Landmark, Lock, UserCog, Clipboard, Banknote, History, Shield } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { FileBadge, Calendar, UserRoundCog, Contact, BookUser } from 'lucide-react';
import { Users } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url'; // Add this import
import GoalController from '@/actions/App/Http/Controllers/GoalController';

const ExpendituresItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Airplay,
    },
    {
        title: 'Goals',
        href: GoalController.index().url,
        icon: Landmark,
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Lock,
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
    },
];

// const AccessControlItems: NavItem[] = [
//     {
//         title: 'Run Payroll',
//         href: PayrollController.index(),
//         icon: Banknote,
//     },
//     {
//         title: 'Employees',
//         href: '/employees',
//         icon: CircleUser,
//     },
//     {
//         title: 'Application Leaves',
//         href: ApplicationLeaveController.index(),
//         icon: Clipboard,
//     },
//     {
//         title: 'Payroll Periods',
//         href: PayrollPeriodController.index(),
//         icon: Calendar,
//     },
//     {
//         title: 'Positions',
//         href: '/positions',
//         icon: UserCog,
//     },

//     {
//         title: 'Logs',
//         href: LogsController.index(),
//         icon: History,
//     },
// ];

// const AttendanceItems: NavItem[] = [
//     {
//         title: 'Attendance',
//         href: '/attendances',
//         icon: Users,
//     },
//     {
//         title: 'Attendance Exception Stats',
//         href: '/attendance-exception-stats',
//         icon: CircleUser,
//     },
//     {
//         title: 'Attendance Logs',
//         href: '/attendance-logs',
//         icon: Contact,
//     },
//     {
//         title: 'Attendance Period Stats',
//         href: '/attendance-period-stats',
//         icon: BookUser,
//     },
//     {
//         title: 'Attendance Schedules',
//         href: '/attendance-schedules',
//         icon: UserRoundCog,
//     },
// ];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { state } = useSidebar();
    const { isCurrentUrl } = useCurrentUrl(); // Add this hook
    const isExpanded = state === 'expanded';

    return (
        <Sidebar collapsible="icon" className="border-r-1 bg-white border-gray-400">
            <SidebarHeader className="px-5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="py-10"
                            asChild
                        >
                            <Link href={dashboard()} prefetch className="h-8 w-8 hover:bg-white">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={`
                ${isExpanded ? 'px-5' : '-ml-3 px-5 transition-all duration-200 ease-in-out'}`}
            >
                <NavMain items={ExpendituresItems} label="Goals" />
                {/* <NavMain items={AccessControlItems} label="Access Control" /> */}
                {/* <NavMain items={AttendanceItems} label="Attendance" /> */}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}