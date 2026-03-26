import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import Sidebar from '@/Components/Admin/Sidebar';
import Topbar from '@/Components/Admin/Topbar';
import Toast from '@/Components/Admin/Toast';
import { useTheme } from '@/hooks/useTheme';

// Inner component — needs access to useToast which requires ToastProvider above it
function AdminLayoutInner({ children, title }) {
    const { flash } = usePage().props;
    const { addToast } = useToast();
    useTheme();

    const [collapsed,   setCollapsed]   = useState(() => {
        try { return localStorage.getItem('adminSidebarCollapsed') === 'true'; } catch { return false; }
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    // Bridge server flash messages → toasts
    useEffect(() => {
        if (flash?.success) addToast('success', flash.success);
        if (flash?.error)   addToast('error',   flash.error);
        if (flash?.warning) addToast('warning', flash.warning);
        if (flash?.info)    addToast('info',    flash.info);
    }, [flash]);

    function handleToggleCollapse() {
        setCollapsed((prev) => {
            const next = !prev;
            try { localStorage.setItem('adminSidebarCollapsed', String(next)); } catch {}
            return next;
        });
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <Topbar
                    title={title}
                    onOpenMobile={() => setMobileOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>

            <Toast />
        </div>
    );
}

export default function AdminLayout({ children, title }) {
    return (
        <ToastProvider>
            <AdminLayoutInner title={title}>
                {children}
            </AdminLayoutInner>
        </ToastProvider>
    );
}
