import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildCarUrl } from "../../utils/urlBuilders";
import {
  FiHome,
  FiPlus,
  FiEye,
  FiMessageSquare,
  FiUser,
  FiLogOut,
  FiBell,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiBarChart2,
} from "react-icons/fi";
import {
  useGetMeQuery,
  useGetMyCarsQuery,
  useLogoutMutation,
  useGetUserNotificationsQuery,
} from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import LazyImage from "../../components/common/LazyImage";
import { images } from "../../assets/assets";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: user, isLoading: userLoading } = useGetMeQuery();
  const { data: carsData, isLoading: carsLoading } = useGetMyCarsQuery();
  const { data: notificationsData } = useGetUserNotificationsQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 30000 }
  );
  const [logout] = useLogoutMutation();

  const cars = carsData?.cars || [];
  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const stats = {
    totalAds: cars.length,
    activeListings: cars.filter((c) => !c.isSold && c.isActive).length,
    soldCars: cars.filter((c) => c.isSold).length,
    totalEarnings: cars
      .filter((c) => c.isSold)
      .reduce((sum, c) => sum + (c.price || 0), 0),
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      // clearTokens is called by transformResponse, but ensure cleanup
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      // Clear tokens even if logout request fails
      const { clearTokens } = await import("../../utils/tokenRefresh");
      clearTokens();
      localStorage.removeItem("user");
      toast.error("Logout failed");
      navigate("/login");
    }
  };

  // Redirect logic based on user role and verification status
  useEffect(() => {
    if (!userLoading && user) {
      // Redirect individual users to home page
      if (user.role === "individual") {
        navigate("/", { replace: true });
        return;
      }

      // Redirect admins to admin dashboard
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Redirect verified dealers to dealer dashboard
      if (user.role === "dealer" && user.dealerInfo?.verified) {
        navigate("/dealer/dashboard", { replace: true });
        return;
      }
    }
  }, [user, userLoading, navigate]);

  // Don't show full-page loader - let page render normally
  if (userLoading) {
    return null;
  }

  // Only unverified dealers can access this dashboard
  // All other users are redirected (handled in useEffect above)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Please login with an appropriate account.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Redirect individual users, admins, and verified dealers (handled in useEffect above)
  if (
    user.role === "individual" ||
    user.role === "admin" ||
    (user.role === "dealer" && user.dealerInfo?.verified)
  ) {
    return null; // Will redirect in useEffect
  }

  // Only unverified dealers can access this dashboard
  if (user.role !== "dealer" || user.dealerInfo?.verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            {user?.role === "admin"
              ? "Admins should use the admin dashboard."
              : user?.dealerInfo?.verified
              ? "Verified dealers should use the dealer dashboard."
              : "This dashboard is only accessible to unverified dealers."}
          </p>
          <div className="flex gap-3 justify-center">
            {user?.dealerInfo?.verified ? (
              <button
                onClick={() => navigate("/dealer/dashboard")}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
              >
                Go to Dealer Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
              >
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary-500">SELLO</h2>
          <p className="text-xs text-gray-500 mt-1">
            {user?.role === "dealer" ? "Dealer Dashboard" : "My Dashboard"}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "dashboard"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiHome size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate("/create-post")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiPlus size={20} />
            <span>Post New Ad</span>
          </button>

          <button
            onClick={() => setActiveTab("listings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "listings"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiEye size={20} />
            <span>My Listings</span>
            {stats.totalAds > 0 && (
              <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.totalAds}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/seller/chats")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiMessageSquare size={20} />
            <span>Messages</span>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiUser size={20} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {user.role === "dealer" ? "Dealer Dashboard" : "My Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <FiBell size={20} className="text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role === "dealer" ? "Dealer" : "Individual User"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Total Ads Posted
                    </span>
                    <FiTrendingUp className="text-primary-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalAds}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Active Listings
                    </span>
                    <FiCheckCircle className="text-green-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.activeListings}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sold Cars</span>
                    <FiCheckCircle className="text-primary-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.soldCars}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Total Earnings
                    </span>
                    <FiDollarSign className="text-green-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    PKR {stats.totalEarnings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Recent Listings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Listings
                  </h3>
                  <button
                    onClick={() => navigate("/my-listings")}
                    className="text-primary-500 hover:text-primary-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                {carsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner fullScreen={false} />
                  </div>
                ) : cars.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No listings yet. Start by posting your first ad!</p>
                    <button
                      onClick={() => navigate("/create-post")}
                      className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                    >
                      Post New Ad
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cars.slice(0, 6).map((car) => (
                      <div
                        key={car._id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(buildCarUrl(car))}
                      >
                        <div className="h-48 relative">
                          <LazyImage
                            src={car.images?.[0] || images.carPlaceholder}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                          {car.isSold && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              SOLD
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {car.make} {car.model} {car.year}
                          </h4>
                          <p className="text-primary-500 font-bold mt-1">
                            PKR {car.price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "listings" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  My Listings
                </h3>
                <button
                  onClick={() => navigate("/create-post")}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                  <FiPlus size={18} />
                  New Listing
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cars.map((car) => (
                  <div
                    key={car._id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-48 relative">
                      <LazyImage
                        src={car.images?.[0] || images.carPlaceholder}
                        alt={car.title}
                        className="w-full h-full object-cover"
                      />
                      {car.isSold && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          SOLD
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900">
                        {car.make} {car.model} {car.year}
                      </h4>
                      <p className="text-primary-500 font-bold mt-1">
                        PKR {car.price?.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => navigate(`/edit-car/${car._id}`)}
                          className="flex-1 px-3 py-2 bg-primary-500 text-white rounded text-sm hover:opacity-90"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(buildCarUrl(car))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
