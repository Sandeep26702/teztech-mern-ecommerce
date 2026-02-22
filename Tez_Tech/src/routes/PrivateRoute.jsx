import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Loading State: Jab tak user check ho raha hai, blank/loader dikhayein
  if (loading) {
    return <div>Loading...</div>; 
  }

  // 2. Authentication Check: Agar user login nahi hai
  if (!isAuthenticated) {
    // User ko Login page pe bhejein, lekin yaad rakhein wo kahan jaana chahta tha
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authorization Check: Agar role match nahi karta (e.g., User trying to access Admin Dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Unauthorized users go to Home
  }

  // 4. Access Granted: Child routes render karein
  return <Outlet />;
};

export default PrivateRoute;