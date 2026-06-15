import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Loading State: Show a loading indicator while user authentication is being verified
  if (loading) {
    return <div>Loading...</div>; 
  }

  // 2. Authentication Check: If the user is not logged in
  if (!isAuthenticated) {
    // Redirect the user to the Login page, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authorization Check: If the user's role is not authorized (e.g., User trying to access Admin Dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Unauthorized users go to Home
  }

  // 4. Access Granted: Render child routes
  return <Outlet />;
};

export default PrivateRoute;