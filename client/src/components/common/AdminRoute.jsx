import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useGetMeQuery } from "../../redux/services/api";
import { canAccessMenu } from "../../utils/roleAccess";
import { useMemo } from "react";

const AdminRoute = () => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Create a key for Outlet to force re-render on navigation
  const outletKey = useMemo(() => {
    return `${location.pathname}${location.search}${location.hash}`;
  }, [location.pathname, location.search, location.hash]);

  // Get cached user from localStorage as fallback
  const getCachedUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error("Error parsing cached user", e);
    }
    return null;
  };

  const cachedUser = getCachedUser();
  const currentUser = user || cachedUser;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state - don't redirect while loading
  if (isLoading && !cachedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle errors - check if it's a network error or auth error
  if (isError && !cachedUser) {
    console.error("AdminRoute - Error fetching user", error);

    // If it's a network error, try to use cached user
    if (
      error?.status === "FETCH_ERROR" ||
      error?.data?.message?.includes("Failed to fetch") ||
      error?.data?.error?.includes("Failed to fetch")
    ) {
      if (cachedUser && cachedUser.role === "admin") {
        // Continue with cached user
      } else {
        return (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <p className="text-red-500 mb-2">Unable to connect to server</p>
              <p className="text-gray-600 text-sm">
                Please check your connection and try again
              </p>
            </div>
          </div>
        );
      }
    } else if (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.originalStatus === 401 ||
      error?.originalStatus === 403
    ) {
      // For auth errors (401, 403), clear token and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    } else {
      // Other errors - try cached user if available
      if (cachedUser && cachedUser.role === "admin") {
        // Continue with cached user
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
      }
    }
  }

  // Check if user data exists (either from API or cache)
  if (!currentUser) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin or team member with admin role
  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Check if user has access to the current route based on their role
  const currentPath = location.pathname;

  // Allow dashboard for all admins
  if (currentPath === "/admin/dashboard") {
    return <Outlet key={outletKey} />;
  }

  // Check role-based access for other routes
  if (!canAccessMenu(currentUser, currentPath)) {
    // Redirect to dashboard if user doesn't have access
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet key={outletKey} />;
};

export default AdminRoute;
