import { isParentLockEnabled } from './parentLock';
import { isParentUnlocked } from './parentSession';

const PROTECTED_PARENT_PREFIXES = ['/parent'];

/**
 * Checks if a route path is a protected parent route.
 */
export function isParentProtectedRoute(route: string): boolean {
  if (!route) return false;
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return PROTECTED_PARENT_PREFIXES.some(
    (prefix) => cleanRoute === prefix || cleanRoute.startsWith(`${prefix}/`)
  );
}

/**
 * Checks if a route can be accessed immediately without a parent check.
 */
export async function canAccessParentRoute(route: string): Promise<boolean> {
  if (!isParentProtectedRoute(route)) {
    return true;
  }

  const lockEnabled = await isParentLockEnabled();
  if (!lockEnabled) {
    return true;
  }

  return isParentUnlocked();
}
