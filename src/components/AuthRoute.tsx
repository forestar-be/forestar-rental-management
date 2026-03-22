import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthProvider';

const AuthRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.token) {
    const returnUrl = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
        replace
      />
    );
  }

  return <Outlet />;
};

export default AuthRoute;
