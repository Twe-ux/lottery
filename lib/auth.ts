import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export function checkPermission(
  userRole: string,
  action: string,
  resource: string
): boolean {
  // Super admin : tout
  if (userRole === 'super_admin') {
    return true;
  }

  // Commerce admin : son commerce uniquement
  if (userRole === 'commerce_admin') {
    if (resource === 'commerce' && action === 'read') return true;
    if (resource === 'prize' && ['read', 'create', 'update', 'delete'].includes(action))
      return true;
    if (resource === 'campaign' && ['read', 'create', 'update', 'delete'].includes(action))
      return true;
    if (resource === 'review' && action === 'read') return true;
    if (resource === 'winner' && ['read', 'update'].includes(action)) return true;
    return false;
  }

  // Employee : lecture + valider gains uniquement
  if (userRole === 'employee') {
    if (action === 'read') return true;
    if (resource === 'winner' && action === 'update') return true;
    return false;
  }

  return false;
}
