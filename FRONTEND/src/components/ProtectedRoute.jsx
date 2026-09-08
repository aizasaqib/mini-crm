import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser?.token) {
        user = parsedUser;
      }
    }
  } catch {
    user = null;
  }

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;