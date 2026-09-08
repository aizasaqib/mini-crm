import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
<<<<<<< HEAD
  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.token) user = parsedUser;
    }
  } catch {
    user = null;
  }
=======
  let token = null;
>>>>>>> bd323aaf56ea9dadd951c0160c895f57a194209b

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