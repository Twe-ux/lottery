import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      console.log('🔐 [MIDDLEWARE] Path:', path);
      console.log('🔐 [MIDDLEWARE] Token:', token);

      // Routes publiques
      if (path.startsWith('/api/auth') || path === '/auth/signin') {
        console.log('✅ [MIDDLEWARE] Route publique, accès autorisé');
        return true;
      }

      // Routes admin nécessitent authentification ET rôle admin
      if (path.startsWith('/dashboard')) {
        const hasToken = !!token;
        const isAdmin = token?.role && ['super_admin', 'admin', 'commerce_admin', 'employee'].includes(token.role as string);
        const isAuthorized = hasToken && isAdmin;
        console.log('🔐 [MIDDLEWARE] Dashboard - Token:', hasToken, '- Rôle:', token?.role, '- Autorisé:', isAuthorized);
        return isAuthorized;
      }

      console.log('✅ [MIDDLEWARE] Route non protégée, accès autorisé');
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
