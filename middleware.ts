import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Routes publiques
      if (path.startsWith('/api/auth') || path === '/auth/signin') {
        return true;
      }

      // Routes admin nécessitent authentification
      if (path.startsWith('/dashboard')) {
        return !!token;
      }

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
