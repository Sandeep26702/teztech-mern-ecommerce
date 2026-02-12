import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuth = true; // Changed to true so dashboard shows

  return isAuth ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
