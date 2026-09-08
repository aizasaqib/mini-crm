import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  let token = null;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    token = user?.token || null;
  } catch {
    token = null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in
  return children;
}

export default ProtectedRoute;