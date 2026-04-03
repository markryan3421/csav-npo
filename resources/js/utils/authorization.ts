export const hasRole = (role: string, userRoles: string[] = []) => {
    return userRoles.includes(role);
}

export const hasPermission = (userPermissions: string[], permission: string) => {
    return userPermissions.includes(permission);
}