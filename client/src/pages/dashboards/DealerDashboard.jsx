import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildCarUrl } from "../../utils/urlBuilders";
import {
  FiHome,
  FiPlus,
  FiEye,
  FiMessageSquare,
  FiCreditCard,
  FiUser,
  FiLogOut,
  FiBell,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEdit,
  FiTrash2,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import {
  useGetMeQuery,
  useGetMyCarsQuery,
  useLogoutMutation,
  useGetUserNotificationsQuery,
  useGetSubscriptionPlansQuery,
} from "../../redux/services/api";
import { useGetSellerBuyerChatsQuery } from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import LazyImage from "../../components/common/LazyImage";
import { images } from "../../assets/assets";
import AccountDeletionRequest from "../../components/profile/AccountDeletionRequest";

const DealerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSection, setActiveSection] = useState("");
  const {
    data: user,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useGetMeQuery(undefined, {
    pollingInterval: 30000, // Refetch every 30 seconds to check verification status
  });
  const {
    data: carsData,
    isLoading: carsLoading,
    refetch: refetchCars,
  } = useGetMyCarsQuery();
  const { data: chatsData } = useGetSellerBuyerChatsQuery(undefined, {
    pollingInterval: 5000,
  });
  const { data: notificationsData } = useGetUserNotificationsQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 30000 }
  );
  const { data: subscriptionPlansData } = useGetSubscriptionPlansQuery();
  const [logout] = useLogoutMutation();

  // Check if subscription tab should be shown
  // If showSubscriptionTab is explicitly false, hide it
  // Otherwise, show it (default behavior when undefined or true)
  const showSubscriptionTab =
    subscriptionPlansData?.showSubscriptionTab !== false;

  // Redirect if user is on payments tab but it's disabled
  useEffect(() => {
    if (!showSubscriptionTab && activeTab === "payments") {
      setActiveTab("dashboard");
    }
  }, [showSubscriptionTab, activeTab]);

  const cars = carsData?.cars || [];
  const chats = chatsData || [];
  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Calculate statistics - handle undefined/null safely
  const activeListingsCount = Array.isArray(cars)
    ? cars.filter(
        (c) => c && !c.isSold && (c.isActive || c.status === "active")
      ).length
    : 0;
  const isSubscriptionActive =
    user?.subscription?.isActive &&
    user?.subscription?.endDate &&
    new Date(user.subscription.endDate) > new Date();

  // Subscription limits based on plan
  const getListingLimit = () => {
    if (user?.subscription?.plan === "free") return 5;
    if (["basic", "premium", "dealer"].includes(user?.subscription?.plan))
      return -1; // unlimited
    return 5; // default free plan
  };

  const listingLimit = isSubscriptionActive ? getListingLimit() : 5;
  const canPostMore = listingLimit === -1 || activeListingsCount < listingLimit;
  const listingsRemaining =
    listingLimit === -1
      ? "Unlimited"
      : Math.max(0, listingLimit - activeListingsCount);

  const stats = {
    totalAds: cars.length,
    activeListings: activeListingsCount,
    pendingApproval: cars.filter((c) => !c.isActive && !c.isSold).length,
    totalInquiries: chats.length,
    profileCompletion: user?.dealerInfo?.verified ? 100 : 70,
    subscriptionPlan: user?.subscription?.plan || "free",
    subscriptionActive: isSubscriptionActive,
    listingLimit,
    listingsRemaining,
    canPostMore,
    subscriptionEndDate: user?.subscription?.endDate,
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

  // Don't show full-page loader - let page render normally
  if (userLoading) {
    return null;
  }

  // Check if user is a verified dealer
  // DealerDashboard is ONLY for VERIFIED dealers
  const isDealer = user?.role === "dealer";
  const isVerified = user?.dealerInfo?.verified === true;

  // Redirect unverified dealers to seller dashboard
  useEffect(() => {
    if (!userLoading && user) {
      if (isDealer && !isVerified) {
        navigate("/seller/dashboard", { replace: true });
      } else if (!isDealer) {
        // Not a dealer - redirect based on role
        if (user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    }
  }, [user, userLoading, isDealer, isVerified, navigate]);

  if (!user || !isDealer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-yellow-500"
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
            {!isDealer
              ? "You need to be a verified dealer to access this dashboard."
              : "Your dealer account is pending verification. Please wait for admin approval."}
          </p>
          <div className="flex gap-3 justify-center">
            {!isDealer ? (
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
              >
                Go to Profile
              </button>
            ) : (
              <button
                onClick={() => navigate("/seller/dashboard")}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
              >
                Go to Seller Dashboard
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only verified dealers can access - if not verified, redirect (handled in useEffect)
  if (!isVerified) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary-500">SELLO</h2>
          <p className="text-xs text-gray-500 mt-1">Dealer Dashboard</p>
        </div>

        {/* Navigation */}
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
            onClick={() => setActiveTab("post-ad")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "post-ad"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
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
            onClick={() => setActiveTab("messages")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "messages"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiMessageSquare size={20} />
            <span>Messages</span>
            {chats.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {chats.length}
              </span>
            )}
          </button>

          {showSubscriptionTab && (
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "payments"
                  ? "bg-primary-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiCreditCard size={20} />
              <span>Payments</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "analytics"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiBarChart2 size={20} />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
          >
            <FiUser size={20} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-primary-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiSettings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Logout */}
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
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">
              {activeTab.replace("-", " ")}
            </h2>
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <FiBell size={20} className="text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Avatar */}
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
                  <p className="text-xs text-gray-500">Dealer</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <span className="text-sm text-gray-600">
                      Pending Approval
                    </span>
                    <FiClock className="text-yellow-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.pendingApproval}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Total Inquiries
                    </span>
                    <FiMessageSquare className="text-primary-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalInquiries}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Profile Completion
                    </span>
                    <FiUser className="text-purple-500" size={20} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.profileCompletion}%
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${stats.profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Subscription Status Card - Only show if subscription tab is enabled */}
              {showSubscriptionTab && (
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-sm border border-gray-200 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Subscription Status
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        stats.subscriptionActive
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {stats.subscriptionActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-primary-100">Current Plan</p>
                      <p className="font-semibold text-lg capitalize">
                        {stats.subscriptionPlan} Plan
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-100">
                        Active Listings
                      </p>
                      <p className="font-semibold text-lg">
                        {stats.activeListings} /{" "}
                        {stats.listingLimit === -1 ? "∞" : stats.listingLimit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-100">Remaining</p>
                      <p className="font-semibold text-lg">
                        {stats.listingsRemaining}
                      </p>
                    </div>
                  </div>
                  {stats.subscriptionEndDate &&
                    stats.subscriptionActive &&
                    !isNaN(new Date(stats.subscriptionEndDate).getTime()) && (
                      <p className="text-sm text-primary-100 mb-4">
                        Expires on:{" "}
                        {new Date(
                          stats.subscriptionEndDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                  {(!stats.subscriptionActive || !stats.canPostMore) && (
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full md:w-auto px-6 py-2 bg-white text-primary-500 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
                    >
                      {!stats.subscriptionActive
                        ? "Upgrade Subscription"
                        : "Manage Subscription"}
                    </button>
                  )}
                </div>
              )}

              {/* Quick Stats Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Business Overview
                  </h3>
                  <button
                    onClick={() => navigate("/profile")}
                    className="text-sm text-primary-500 hover:text-primary-500 font-medium"
                  >
                    Manage Profile →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-l-4 border-primary-500 pl-4">
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {user.dealerInfo?.businessName || "Not set"}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-600">Verification Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                        user.dealerInfo?.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {user.dealerInfo?.verified ? (
                        <>
                          <FiCheckCircle size={14} />
                          Verified
                        </>
                      ) : (
                        <>
                          <FiClock size={14} />
                          Pending
                        </>
                      )}
                    </span>
                  </div>
                  <div className="border-l-4 border-primary-500 pl-4">
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {user.dealerInfo?.city || "Not set"}
                    </p>
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
                    onClick={() => navigate("/create-post")}
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
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                car.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {car.isActive ? "Active" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "post-ad" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Post a New Listing
              </h3>
              {!stats.canPostMore &&
                !stats.subscriptionActive &&
                showSubscriptionTab && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FiClock className="text-yellow-600 mt-0.5" size={20} />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-1">
                          Listing Limit Reached
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          You've used all {stats.listingLimit} listings on your
                          free plan. Upgrade to post more listings.
                        </p>
                        <button
                          onClick={() => navigate("/profile")}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                          Upgrade Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              <button
                onClick={() => {
                  if (
                    !stats.canPostMore &&
                    !stats.subscriptionActive &&
                    showSubscriptionTab
                  ) {
                    toast.error(
                      `You've reached your listing limit. Please upgrade your subscription.`
                    );
                    navigate("/profile");
                    return;
                  }
                  navigate("/create-post");
                }}
                disabled={
                  !stats.canPostMore &&
                  !stats.subscriptionActive &&
                  showSubscriptionTab
                }
                className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlus size={48} className="text-gray-400" />
                <span className="text-lg font-medium text-gray-700">
                  {!stats.canPostMore &&
                  !stats.subscriptionActive &&
                  showSubscriptionTab
                    ? "Upgrade to Post More Listings"
                    : "Click to Create New Listing"}
                </span>
              </button>
              {stats.canPostMore && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  {stats.listingsRemaining === "Unlimited"
                    ? "Unlimited listings available"
                    : `${stats.listingsRemaining} listing${
                        stats.listingsRemaining !== 1 ? "s" : ""
                      } remaining`}
                </p>
              )}
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
                          <FiEdit className="inline mr-1" size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(buildCarUrl(car))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <FiEye className="inline mr-1" size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Messages
              </h3>
              <button
                onClick={() => navigate("/seller/chats")}
                className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <FiMessageSquare size={48} className="text-gray-400" />
                <span className="text-lg font-medium text-gray-700">
                  View All Messages
                </span>
              </button>
            </div>
          )}

          {activeTab === "payments" && showSubscriptionTab && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Payments
              </h3>
              <p className="text-gray-600">
                Payment history and subscription management coming soon.
              </p>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Analytics
              </h3>
              <p className="text-gray-600">Analytics dashboard coming soon.</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Account Management
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Manage your account settings and preferences.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium text-left"
                    >
                      Edit Profile Information
                    </button>
                    <button
                      onClick={() => setActiveSection("account-deletion")}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium text-left"
                    >
                      Request Account Deletion
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Business Settings
                  </h4>
                  <p className="text-gray-600">
                    Business settings and preferences coming soon.
                  </p>
                </div>
              </div>

              {/* Account Deletion Section */}
              {activeSection === "account-deletion" && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <AccountDeletionRequest user={user} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DealerDashboard;
