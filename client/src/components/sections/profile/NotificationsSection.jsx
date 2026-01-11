import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../contexts/SocketContext";
import {
  MdNotifications,
  MdNotificationsActive,
  MdCheck,
  MdCheckCircle,
} from "react-icons/md";
import { FaBell, FaCheckDouble } from "react-icons/fa";
import {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "../../../redux/services/api";
import toast from "react-hot-toast";

const NotificationsSection = () => {
  const [filter, setFilter] = useState("all"); // all, unread, read
  const navigate = useNavigate();
  const { socket: globalSocket } = useSocket();

  const { data: notificationsData, refetch } = useGetUserNotificationsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: 30000 }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const allNotifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Filter notifications
  const filteredNotifications = allNotifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  // Store refetch function in ref to prevent infinite re-renders
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  });

  // Listen for new notifications using centralized socket
  useEffect(() => {
    if (!globalSocket) return;

    const handleNewNotification = (data) => {
      console.log(
        "🔔 New notification received in NotificationsSection:",
        data
      );
      // Show browser notification for real notifications only
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(
          data.title || "New notification",
          {
            body: data.message || "You have a new notification",
            icon: "🔔",
            tag: "sello-notification",
          }
        );

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      refetchRef.current();
    };

    globalSocket.on("new-notification", handleNewNotification);

    return () => {
      globalSocket.off("new-notification", handleNewNotification);
    };
  }, [globalSocket]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
        refetchRef.current();
      } catch {
        console.error("Failed to mark notification as read");
      }
    }

    // Navigate to action URL if available
    // For support chats, actionUrl will be:
    // - Users:  `/support?chatId=...`  → handled by SupportRouteRedirect (opens widget)
    // - Admins: `/admin/support-chatbot/:chatId` → handled by admin routes
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
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "info":
      default:
        return "bg-primary-50 border-primary-200 text-primary-800";
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
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            {unreadCount > 0 ? (
              <MdNotificationsActive className="text-2xl text-primary-500" />
            ) : (
              <MdNotifications className="text-2xl text-primary-500" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Notifications
            </h2>
            <p className="text-sm text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount > 1 ? "s" : ""
                  }`
                : "All caught up!"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FaCheckDouble />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({allNotifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "unread"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === "read"
              ? "text-primary-500 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Read ({allNotifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <MdNotifications className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                !notification.isRead
                  ? `${getNotificationColor(notification.type)} border-l-4`
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className={`font-semibold ${
                        !notification.isRead ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
                    )}
                    {notification.isRead && (
                      <MdCheckCircle className="text-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
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
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsSection;
