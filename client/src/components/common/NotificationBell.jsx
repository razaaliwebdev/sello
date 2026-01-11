import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTimes,
  FaTag,
  FaCalendar,
  FaPercent,
  FaDollarSign,
} from "react-icons/fa";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "../../redux/services/api";
import toast from "react-hot-toast";

// Request notification permission and show browser notification
const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  }
  return false;
};

// Show browser notification
const showBrowserNotification = (title, message, icon = "🔔") => {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body: message,
      icon: icon,
      tag: "sello-notification",
      badge: "1",
      renotify: true,
      requireInteraction: false,
      silent: false,
    });

    // Auto-focus the window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const { data: notificationsData, refetch } = useGetUserNotificationsQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 30000 } // Poll every 30 seconds
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const notifications = notificationsData?.notifications || [];
  const totalUnread = notificationsData?.unreadCount || 0;

  useEffect(() => {
    setUnreadCount(totalUnread);
  }, [totalUnread]);

  // Store refetch function in ref to prevent infinite re-renders
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  });

  // Listen for new notifications using centralized socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      console.log("🔔 New notification received in NotificationBell:", data);
      // Show browser notification for real notifications only
      showBrowserNotification(
        data.title || data.message || "New notification",
        data.message || data.title
      );

      // Refetch notifications so the bell counter updates instantly
      refetchRef.current();
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
        refetchRef.current();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setIsOpen(false);

    // Check if this is an old promotion notification by URL pattern
    if (
      notification.actionUrl &&
      notification.actionUrl.includes("/promotions/")
    ) {
      // Create mock promotion data for old notifications
      const mockPromotionData = {
        promotionId: notification.actionUrl.split("/").pop(),
        title: notification.title.replace("🎉 New Promotion: ", ""),
        description: "Click to view promotion details",
        promoCode: "PROMO123", // Default code
        discountType: "percentage",
        discountValue: 10,
        minPurchaseAmount: 0,
        maxDiscountAmount: null,
        usageLimit: 100,
        usedCount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "active",
        targetAudience: "all",
      };

      setSelectedPromotion(mockPromotionData);
      setShowPromotionModal(true);
      return;
    }

    // Show promotion modal for promotion notifications
    if (notification.type === "promotion" && notification.metadata) {
      setSelectedPromotion(notification.metadata);
      setShowPromotionModal(true);
      return;
    }

    // Navigate to action URL if available for other notifications
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetchRef.current();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      case "promotion":
        return "🎉";
      default:
        return "ℹ️";
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-current hover:opacity-80 transition-all rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <div className="relative">
          {unreadCount > 0 ? (
            <MdNotificationsActive className="text-2xl text-current" />
          ) : (
            <MdNotifications
              className={`text-2xl ${
                location.pathname === "/cars"
                  ? "text-primary-500"
                  : "text-current"
              }`}
            />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg border-2 border-white transform translate-x-1/2 -translate-y-1/2 z-10">
              {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MdNotifications className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`text-2xl ${
                          !notification.isRead ? "animate-pulse" : ""
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-semibold ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.actionText && (
                            <span className="text-xs text-primary-500 font-medium">
                              {notification.actionText} →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => navigate("/profile")}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Promotion Details Modal */}
      {showPromotionModal && selectedPromotion && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowPromotionModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg sm:max-w-lg sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaTag className="text-orange-500" />
                  Promotion Details
                </h3>
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {selectedPromotion.title}
                  </h4>
                  {selectedPromotion.description && (
                    <p className="mt-2 text-gray-600">
                      {selectedPromotion.description}
                    </p>
                  )}
                </div>

                {/* Promo Code Box */}
                <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-2">
                    Your Promo Code
                  </p>
                  <p className="text-3xl font-bold text-orange-600 font-mono tracking-wider">
                    {selectedPromotion.promoCode}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Click to copy →</p>
                </div>

                {/* Discount Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      {selectedPromotion.discountType === "percentage" ? (
                        <FaPercent />
                      ) : (
                        <FaDollarSign />
                      )}
                      Your Discount:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {selectedPromotion.discountType === "percentage"
                        ? `${selectedPromotion.discountValue}% OFF`
                        : `$${selectedPromotion.discountValue} OFF`}
                    </span>
                  </div>

                  {selectedPromotion.minPurchaseAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Min Purchase:</span>
                      <span className="text-lg font-bold text-purple-600">
                        ${selectedPromotion.minPurchaseAmount}
                      </span>
                    </div>
                  )}

                  {selectedPromotion.maxDiscountAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Max Discount:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${selectedPromotion.maxDiscountAmount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Validity */}
                <div className="flex items-center justify-between bg-red-50 rounded-lg p-4">
                  <span className="text-gray-600 flex items-center gap-2">
                    <FaCalendar className="text-red-500" />
                    Valid Until:
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {new Date(selectedPromotion.endDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>

                {/* Usage Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Usage Limit:</span>
                    <span className="font-medium">
                      {selectedPromotion.usageLimit
                        ? `${selectedPromotion.usageLimit} uses`
                        : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                    <span>Used:</span>
                    <span className="font-medium">
                      {selectedPromotion.usedCount || 0} times
                    </span>
                  </div>
                  {selectedPromotion.usageLimit && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((selectedPromotion.usedCount || 0) /
                                selectedPromotion.usageLimit) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(
                          ((selectedPromotion.usedCount || 0) /
                            selectedPromotion.usageLimit) *
                            100
                        )}
                        % used
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> This offer cannot be combined
                    with other offers. Terms and conditions apply.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPromotionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPromotion.promoCode);
                    toast.success("Promo code copied to clipboard!");
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
