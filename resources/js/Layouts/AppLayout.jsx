import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useAppStore } from '@/Stores/appStore';
import { usePermissions } from '@/Hooks/usePermissions';
import {
    HomeIcon, UsersIcon, BriefcaseIcon,
    ShoppingCartIcon, CubeIcon, CurrencyDollarIcon, UserGroupIcon,
    Cog6ToothIcon, ChevronDownIcon, ChevronRightIcon,
    Bars3Icon, UserCircleIcon,
    FunnelIcon, ReceiptPercentIcon,
    ArrowRightOnRectangleIcon, KeyIcon,
    Squares2X2Icon, BellIcon, MagnifyingGlassIcon, XMarkIcon,
    ClipboardDocumentListIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import {
    HomeIcon as HomeIconSolid,
    FunnelIcon as FunnelIconSolid,
    BellIcon as BellIconSolid,
    BriefcaseIcon as BriefcaseIconSolid,
    Squares2X2Icon as Squares2X2IconSolid,
} from '@heroicons/react/24/solid';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { useThemeColor } from '@/Hooks/useThemeColor';

const navGroups = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, single: true },
    {
        name: 'CRM', icon: FunnelIcon, permission: 'view.leads',
        children: [
            { name: 'Dashboard', href: '/crm/dashboard' },
            { name: 'Pipeline', href: '/crm' },
            { name: 'All Leads', href: '/crm/leads' },
            { name: 'Follow-ups', href: '/crm/follow-ups' },
            { name: 'Reports', href: '/crm/reports' },
        ],
    },
    { name: 'Clients', href: '/clients', icon: UsersIcon, permission: 'view.clients', single: true },
    {
        name: 'Sales', icon: ReceiptPercentIcon, permission: 'create.quotations',
        children: [
            { name: 'Cost Estimations', href: '/cost-estimations' },
            { name: 'Quotations', href: '/quotations' },
        ],
    },
    { name: 'My Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, single: true },
    { name: 'My Expenses', href: '/my-expenses', icon: BanknotesIcon, single: true, permission: 'submit.expenses' },
    { name: 'Projects', href: '/projects', icon: BriefcaseIcon, permission: 'view.projects', single: true },
    {
        name: 'Procurement', icon: ShoppingCartIcon, permission: 'view.procurement',
        children: [
            { name: 'Vendors', href: '/procurement/vendors' },
            { name: 'Requisitions', href: '/procurement/requisitions' },
            { name: 'Purchase Orders', href: '/procurement/purchase-orders' },
            { name: 'GRN', href: '/procurement/grn' },
        ],
    },
    {
        name: 'Inventory', icon: CubeIcon, permission: 'view.inventory',
        children: [
            { name: 'Items', href: '/inventory/items' },
            { name: 'Categories', href: '/inventory/categories' },
            { name: 'Warehouses', href: '/inventory/warehouses' },
            { name: 'Stock Issue', href: '/inventory/issue' },
            { name: 'Adjustments', href: '/inventory/adjustments' },
            { name: 'Report', href: '/inventory/report' },
        ],
    },
    {
        name: 'Accounts', icon: CurrencyDollarIcon, permission: 'view.accounts',
        children: [
            { name: 'Dashboard', href: '/accounts' },
            { name: 'Invoices', href: '/accounts/invoices' },
            { name: 'Receipts', href: '/accounts/receipts' },
            { name: 'Vendor Payments', href: '/accounts/vendor-payments' },
            { name: 'Expenses', href: '/accounts/expenses' },
            { name: 'Chart of Accounts', href: '/accounts/chart' },
            { name: 'Reports', href: '/accounts/reports' },
        ],
    },
    {
        name: 'HR', icon: UserGroupIcon, permission: 'manage.employees',
        children: [
            { name: 'Employees', href: '/hr/employees' },
            { name: 'Leave', href: '/hr/leaves' },
            { name: 'Attendance', href: '/hr/attendance' },
        ],
    },
    {
        name: 'Settings', icon: Cog6ToothIcon, permission: 'manage.users',
        children: [
            { name: 'General', href: '/settings/general' },
            { name: 'Materials', href: '/settings/materials' },
            { name: 'Expense Categories', href: '/settings/expense-categories' },
            { name: 'Quotation Templates', href: '/settings/quotation-templates' },
            { name: 'Users', href: '/settings/users' },
            { name: 'Roles', href: '/settings/roles' },
            { name: 'Audit Log', href: '/settings/audit-log' },
        ],
    },
];

/* ── Responsive hook ──────────────────────── */
function useIsMobile() {
    const [mobile, setMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setMobile(mq.matches);
        const handler = (e) => setMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return mobile;
}

/* ── Nav Item ─────────────────────────────── */
function NavItem({ group, currentPath, onNavigate }) {
    const { can } = usePermissions();
    const [open, setOpen] = useState(() => {
        if (group.single) return false;
        return group.children?.some(c => currentPath === c.href || currentPath.startsWith(c.href + '/'));
    });

    if (group.permission && !can(group.permission)) return null;

    if (group.single) {
        const isActive = currentPath === group.href || (group.href !== '/' && currentPath.startsWith(group.href));
        return (
            <Link
                href={group.href}
                onClick={onNavigate}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
                <group.icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span>{group.name}</span>
            </Link>
        );
    }

    const isGroupActive = group.children?.some(c => currentPath === c.href || currentPath.startsWith(c.href + '/'));

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className={`w-full sidebar-link ${isGroupActive ? 'text-white font-semibold' : ''}`}
            >
                <group.icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="flex-1 text-left">{group.name}</span>
                <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-4 pl-4 mt-1 mb-1 space-y-0.5 border-l border-white/20">
                    {group.children?.map(child => {
                        const matches = currentPath === child.href || currentPath.startsWith(child.href + '/');
                        const hasBetterMatch = matches && group.children.some(
                            other => other.href !== child.href && other.href.length > child.href.length &&
                                (currentPath === other.href || currentPath.startsWith(other.href + '/'))
                        );
                        const isActive = matches && !hasBetterMatch;
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={isActive ? 'sidebar-child-active' : 'sidebar-child'}
                            >
                                {child.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Sidebar Content (shared between mobile & desktop) ── */
function SidebarContent({ auth, appSettings, currentPath, onNavigate }) {
    const userInitials = auth?.user?.name
        ? auth.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';
    const appName = appSettings?.app_name || 'Interior Villa';
    const logoUrl = appSettings?.company_logo;
    const isLight = appSettings?.sidebar_color === 'white';

    return (
        <>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-5 py-5 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                {logoUrl ? (
                    <img src={logoUrl} alt={appName} className={`w-9 h-9 rounded-xl object-contain p-0.5 flex-shrink-0 ${isLight ? 'bg-gray-100' : 'bg-white/10'}`} />
                ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                        <span className="text-white font-bold text-sm">{appName.substring(0, 2).toUpperCase()}</span>
                    </div>
                )}
                <div className="min-w-0">
                    <div className={`font-semibold text-sm truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{appName}</div>
                    <div className={`text-[10px] uppercase tracking-[0.15em] ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Management System</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 overscroll-contain">
                {navGroups.map(group => (
                    <NavItem key={group.name} group={group} currentPath={currentPath} onNavigate={onNavigate} />
                ))}
            </nav>

            {/* User info */}
            <Link href="/profile" className={`block px-4 py-4 border-t flex-shrink-0 ${isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5'} transition-colors`}>
                <div className="flex items-center gap-3">
                    {auth?.user?.avatar_path ? (
                        <img src={`/storage/${auth.user.avatar_path}`} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {userInitials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{auth?.user?.name}</div>
                        <div className="text-[11px] text-gray-500 capitalize truncate">{auth?.user?.roles?.[0]?.replace(/_/g, ' ')}</div>
                    </div>
                </div>
            </Link>
        </>
    );
}

/* ── Bottom Navigation (mobile) ───────────── */
const BOTTOM_TABS = [
    { name: 'CRM',        href: '/crm',             icon: FunnelIcon,    iconActive: FunnelIconSolid },
    { name: 'Follow-ups', href: '/crm/follow-ups',  icon: BellAlertIcon, iconActive: BellIconSolid },
    { name: 'Home',       href: '/',                icon: HomeIcon,      iconActive: HomeIconSolid, center: true },
    { name: 'Projects',   href: '/projects',        icon: BriefcaseIcon, iconActive: BriefcaseIconSolid },
];

function BottomNav({ currentPath, onMorePress }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
            <nav
                className="bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 6px)' }}
            >
                <div className="flex items-end justify-around px-1 pt-1 pb-1">
                    {BOTTOM_TABS.map(tab => {
                        const isActive = tab.href === '/'
                            ? currentPath === '/'
                            : currentPath === tab.href || currentPath.startsWith(tab.href + '/');
                        // Prevent /crm matching /crm/follow-ups
                        const hasBetterMatch = isActive && BOTTOM_TABS.some(
                            other => other.href !== tab.href && other.href.length > tab.href.length &&
                                (currentPath === other.href || currentPath.startsWith(other.href + '/'))
                        );
                        const active = isActive && !hasBetterMatch;
                        const Icon = active ? tab.iconActive : tab.icon;

                        // Center Home button — raised FAB style
                        if (tab.center) {
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className="flex flex-col items-center -mt-5"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                                        active
                                            ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-500/40 scale-105'
                                            : 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-primary-500/25 active:scale-95'
                                    }`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <span className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                                        {tab.name}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                                    active
                                        ? 'text-primary-600'
                                        : 'text-gray-400 active:text-gray-600 active:bg-gray-50'
                                }`}
                            >
                                <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                                    <Icon className="w-6 h-6" />
                                    {active && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium leading-tight ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More button */}
                    <button
                        onClick={onMorePress}
                        className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 active:text-gray-600 active:bg-gray-50 transition-all min-w-[56px]"
                    >
                        <Squares2X2Icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium leading-tight">More</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}

/* ── Global Search ────────────────────────── */
function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // Close on outside click — ONLY while the overlay is open
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
                setResults([]);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Lock page scroll while the overlay is open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    function closeOverlay() {
        setOpen(false);
        setQuery('');
        setResults([]);
    }

    // Search with debounce
    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setLoading(true);
            axios.get('/api/search', { params: { q: query } })
                .then(r => { setResults(r.data); setSelected(-1); })
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && selected >= 0 && results[selected]) {
            router.get(results[selected].url);
            setOpen(false); setQuery(''); setResults([]);
        }
    }

    function navigate(url) {
        router.get(url);
        setOpen(false); setQuery(''); setResults([]);
    }

    // Group results by type
    const grouped = {};
    results.forEach(r => { if (!grouped[r.type]) grouped[r.type] = []; grouped[r.type].push(r); });
    let flatIndex = -1;

    return (
        <>
            {/* Desktop trigger */}
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white text-gray-400 hover:text-gray-500 transition-all cursor-pointer"
            >
                <MagnifyingGlassIcon className="w-3.5 h-3.5" />
                <span className="text-xs">Search...</span>
                <kbd className="ml-2 text-[9px] font-mono text-gray-300 border border-gray-200 bg-white px-1 py-0.5 rounded">⌘K</kbd>
            </button>

            {/* Mobile/tablet trigger - icon only */}
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
                <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Search overlay — fullscreen */}
            {open && (
                <div ref={containerRef} className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
                    {/* Header: input + close */}
                    <div className="flex items-center gap-3 px-4 sm:px-8 py-4 border-b border-gray-200 bg-white">
                        <MagnifyingGlassIcon className={`w-6 h-6 flex-shrink-0 ${loading ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search leads, clients, projects, invoices…"
                            className="flex-1 py-2 text-lg bg-transparent outline-none placeholder:text-gray-400"
                            autoComplete="off"
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="Clear">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        )}
                        <kbd className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded hidden sm:block">ESC</kbd>
                        <button onClick={closeOverlay}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Close search">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Results — scrollable body */}
                    <div className="flex-1 overflow-y-auto overscroll-contain max-w-3xl mx-auto w-full px-4 sm:px-8 py-4">
                            {query.length < 2 && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-gray-500">Type to search across leads, clients, projects, invoices…</p>
                                    <p className="text-[11px] text-gray-400 mt-1">At least 2 characters</p>
                                </div>
                            )}
                            {query.length >= 2 && results.length === 0 && !loading && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-gray-400">No results for "{query}"</p>
                                    <p className="text-xs text-gray-300 mt-1">Try a different search term</p>
                                </div>
                            )}

                            {Object.entries(grouped).map(([type, items]) => (
                                <div key={type}>
                                    <div className="px-4 py-2 bg-gray-50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{type}s</span>
                                    </div>
                                    {items.map(item => {
                                        flatIndex++;
                                        const idx = flatIndex;
                                        return (
                                            <button
                                                key={`${item.type}-${item.url}`}
                                                onClick={() => navigate(item.url)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected === idx ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                            >
                                                <span className="text-lg flex-shrink-0">{item.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                                                </div>
                                                {selected === idx && (
                                                    <kbd className="text-[10px] font-mono text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:block">Enter</kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                    {/* Footer — sticky at bottom of fullscreen overlay */}
                    {results.length > 0 && (
                        <div className="px-4 sm:px-8 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-6 text-xs text-gray-500">
                            <span><kbd className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded">↑↓</kbd> Navigate</span>
                            <span><kbd className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded">Enter</kbd> Open</span>
                            <span><kbd className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded">Esc</kbd> Close</span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

/* ── Notification Bell ────────────────────── */
function NotificationBell({ notifications, unreadCount }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const ICONS = { lead_assigned: '🎯', task_assigned: '📋', invoice_paid: '💰', quotation_approved: '✅', follow_up: '🔔', leave_request: '🏖️', general: '📢' };

    function timeAgo(date) {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    }

    return (
        <div className="relative flex-shrink-0" ref={ref}>
            <button onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Link href={route('notifications.read-all')} method="post" as="button"
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                    Mark all read
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <p className="px-4 py-8 text-sm text-center text-gray-300">No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <Link key={n.id} href={n.link || '/notifications'}
                                    onClick={() => { setOpen(false); if (!n.read_at) router.patch(route('notifications.read', n.id), {}, { preserveScroll: true }); }}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-primary-50/30' : ''}`}>
                                    <span className="text-lg flex-shrink-0 mt-0.5">{ICONS[n.type] ?? ICONS.general}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${!n.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                                        {n.message && <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>}
                                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                    {!n.read_at && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
                                </Link>
                            ))
                        )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2.5">
                        <Link href="/notifications" onClick={() => setOpen(false)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1">
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main Layout ──────────────────────────── */
export default function AppLayout({ children, title, breadcrumbs }) {
    const { auth, flash, appSettings } = usePage().props;
    useThemeColor();
    const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const isMobile = useIsMobile();

    const currentPath = window.location.pathname;

    // Close user menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileMenuOpen(false); }, [currentPath]);

    const handleLogout = () => { router.post('/logout'); };

    const handleMobileNavigate = useCallback(() => { setMobileMenuOpen(false); }, []);

    const userInitials = auth?.user?.name
        ? auth.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    // Swipe to open sidebar on mobile
    useEffect(() => {
        if (!isMobile) return;
        let startX = 0;
        const onTouchStart = (e) => { startX = e.touches[0].clientX; };
        const onTouchEnd = (e) => {
            const diff = e.changedTouches[0].clientX - startX;
            if (startX < 30 && diff > 60) setMobileMenuOpen(true);  // swipe right from edge
            if (mobileMenuOpen && diff < -60) setMobileMenuOpen(false); // swipe left to close
        };
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [isMobile, mobileMenuOpen]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Desktop Sidebar ────────────────── */}
            {!isMobile && (
                <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 sidebar overflow-hidden transition-all duration-300 ease-in-out hidden md:flex md:flex-col ${appSettings?.sidebar_color === 'white' ? 'sidebar-light-mode border-r border-gray-200' : ''}`}>
                    <SidebarContent auth={auth} appSettings={appSettings} currentPath={currentPath} onNavigate={() => {}} />
                </aside>
            )}

            {/* ── Mobile Sidebar (overlay) ───────── */}
            {isMobile && (
                <>
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Drawer */}
                    <aside
                        className={`fixed inset-y-0 left-0 w-72 z-50 sidebar flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${appSettings?.sidebar_color === 'white' ? 'sidebar-light-mode border-r border-gray-200' : ''}`}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <SidebarContent auth={auth} appSettings={appSettings} currentPath={currentPath} onNavigate={handleMobileNavigate} />
                    </aside>
                </>
            )}

            {/* ── Main Content ───────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Topbar */}
                <header className="topbar" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    <button
                        onClick={() => isMobile ? setMobileMenuOpen(true) : toggleSidebar()}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>

                    {/* Global search */}
                    <GlobalSearch />

                    <div className="flex-1 min-w-0">
                        {breadcrumbs && (
                            <nav className="flex items-center gap-1.5 text-sm">
                                {breadcrumbs.map((crumb, i) => (
                                    <Fragment key={i}>
                                        {i > 0 && <ChevronRightIcon className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                                        {crumb.href ? (
                                            <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 truncate">{crumb.name}</Link>
                                        ) : (
                                            <span className="text-gray-900 font-medium truncate">{crumb.name}</span>
                                        )}
                                    </Fragment>
                                ))}
                            </nav>
                        )}
                    </div>

                    {/* Notification bell */}
                    <NotificationBell
                        notifications={auth?.user?.recent_notifications ?? []}
                        unreadCount={auth?.user?.unread_notifications ?? 0}
                    />

                    {/* User menu */}
                    <div className="relative flex-shrink-0" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            {auth?.user?.avatar_path ? (
                                <img src={`/storage/${auth.user.avatar_path}`} alt="" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {userInitials}
                                </div>
                            )}
                            <span className="hidden sm:block font-medium max-w-[120px] truncate">{auth?.user?.name}</span>
                            <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                    {auth?.user?.avatar_path ? (
                                        <img src={`/storage/${auth.user.avatar_path}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {userInitials}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{auth?.user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{auth?.user?.email}</p>
                                    </div>
                                </div>
                                <div className="py-1">
                                    <Link href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setUserMenuOpen(false)}>
                                        <UserCircleIcon className="w-4 h-4 text-gray-400" /> My Profile
                                    </Link>
                                    <Link href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setUserMenuOpen(false)}>
                                        <KeyIcon className="w-4 h-4 text-gray-400" /> Change Password
                                    </Link>
                                    <button onClick={handleLogout}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Flash messages */}
                {(flash?.success || flash?.error || flash?.warning) && (
                    <div className="px-4 sm:px-6 pt-4 animate-fade-in">
                        {flash.success && (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" /> {flash.success}
                            </div>
                        )}
                        {flash.error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> {flash.error}
                            </div>
                        )}
                        {flash.warning && (
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" /> {flash.warning}
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <main className={`flex-1 overflow-y-auto overscroll-contain ${isMobile ? 'pb-20' : ''}`}>
                    {children}
                </main>
            </div>

            {/* ── Mobile Bottom Nav ──────────────── */}
            {isMobile && (
                <BottomNav currentPath={currentPath} onMorePress={() => setMobileMenuOpen(true)} />
            )}
        </div>
    );
}
