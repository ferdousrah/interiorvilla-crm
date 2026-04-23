import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props;

    const can = (permission) => {
        if (!auth?.user) return false;
        return auth.user.permissions?.includes(permission) || auth.user.roles?.includes('super_admin');
    };

    const hasRole = (role) => {
        if (!auth?.user) return false;
        return auth.user.roles?.includes(role);
    };

    const hasAnyRole = (...roles) => {
        if (!auth?.user) return false;
        return roles.some(role => auth.user.roles?.includes(role));
    };

    return { can, hasRole, hasAnyRole };
}
