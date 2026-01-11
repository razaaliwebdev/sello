import { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  useGetAllNotificationsQuery,
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiX,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
} from "react-icons/fi";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../redux/config";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const Notifications = () => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, info, success, warning, error, system
  const { data, isLoading, refetch } = useGetAllNotificationsQuery({
    page: 1,
    limit: 50,
  });
  const [createNotification, { isLoading: isCreating }] =
    useCreateNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  const notifications = data?.notifications || [];
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.type === filter;
  });

  // Store refetch function in ref to prevent infinite re-renders
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  });

  // Initialize Socket.io for real-time updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(SOCKET_BASE_URL, {
      auth: { token },
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      // Socket connected
    });

    newSocket.on("new-notification", () => {
      // Notification sent successfully - no toast needed
      refetchRef.current();
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []); // Removed refetch to prevent infinite loop

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "system",
    targetAudience: "all",
    specificUser: "",
    actionUrl: "",
    actionText: "",
    scheduleFor: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        recipient:
          formData.targetAudience === "specific" && formData.specificUser
            ? formData.specificUser
            : null,
        targetAudience:
          formData.targetAudience === "specific"
            ? null
            : formData.targetAudience,
        actionUrl: formData.actionUrl.trim() || null,
        actionText: formData.actionText.trim() || null,
        expiresAt: formData.scheduleFor ? new Date(formData.scheduleFor) : null,
      };

      await createNotification(notificationData).unwrap();
      // Notification created successfully - no toast needed
      setShowModal(false);
      setFormData({
        title: "",
        message: "",
        type: "system",
        targetAudience: "all",
        specificUser: "",
        actionUrl: "",
        actionText: "",
        scheduleFor: "",
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create notification");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      title: "",
      message: "",
      type: "info",
      targetAudience: "all",
      specificUser: "",
      actionUrl: "",
      actionText: "",
      scheduleFor: "",
    });
  };

  const handleDelete = (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;
    try {
      await deleteNotification(notificationToDelete).unwrap();
      toast.success("Notification deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete notification");
    } finally {
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-green-500" />;
      case "warning":
        return <FiAlertCircle className="text-yellow-500" />;
      case "error":
        return <FiAlertCircle className="text-red-500" />;
      case "system":
        return <MdNotifications className="text-purple-500" />;
      case "info":
      default:
        return <FiInfo className="text-primary-500" />;
    }
  };

  const getNotificationBadgeColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "system":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "info":
      default:
        return "bg-primary-50 text-primary-800 border-primary-200";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <MdNotificationsActive className="text-2xl text-primary-500 dark:text-primary-400" />
                </div>
                Notifications Management
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                Send and manage notifications for all users
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
            >
              <FiPlus size={20} />
              Create Notification
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalNotifications}
                  </p>
                </div>
                <MdNotifications className="text-3xl text-primary-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Unread</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {unreadCount}
                  </p>
                </div>
                <MdNotificationsActive className="text-3xl text-yellow-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Read</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {totalNotifications - unreadCount}
                  </p>
                </div>
                <FiCheck className="text-3xl text-green-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("info")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "info"
                  ? "bg-primary-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter("success")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "success"
                  ? "bg-green-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter("warning")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "warning"
                  ? "bg-yellow-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter("error")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "error"
                  ? "bg-red-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              Error
            </button>
            <button
              onClick={() => setFilter("system")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "system"
                  ? "bg-purple-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}
            >
              System
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner fullScreen={false} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <MdNotifications className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filter === "all"
                ? "No notifications found. Create your first one!"
                : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification) => (
                    <tr
                      key={notification._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type || "info")}
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getNotificationBadgeColor(
                              notification.type || "info"
                            )}`}
                          >
                            {notification.type || "info"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {notification.recipient ? (
                            <span className="text-primary-500 dark:text-primary-400 font-medium">
                              {notification.recipient?.name || "Specific User"}
                            </span>
                          ) : notification.targetRole ? (
                            <span className="text-primary-500 dark:text-primary-400 font-medium capitalize">
                              {notification.targetRole}s Only
                            </span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              All Users
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(notification.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <ActionDropdown
                          onDelete={() => handleDelete(notification._id)}
                          item={notification}
                          itemName="notification"
                          deleteConfirmMessage="Are you sure you want to delete this notification? This action cannot be undone."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Notification Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <h3 className="text-xl font-bold">Create New Notification</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Notification Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Notification Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., New Feature Available"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Enter your notification message..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Notification Type and Target Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Notification Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notification Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                    >
                      <option value="system">System</option>
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Users</option>
                      <option value="buyers">Buyers Only</option>
                      <option value="sellers">Sellers Only</option>
                      <option value="dealers">Dealers Only</option>
                      <option value="specific">Specific User</option>
                    </select>
                  </div>

                  {/* Specific User Selection - Only show when "specific" is selected */}
                  {formData.targetAudience === "specific" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        User Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="specificUser"
                        value={formData.specificUser}
                        onChange={handleChange}
                        placeholder="Enter user email address"
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Action Link and Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Action Link (Optional)
                    </label>
                    <input
                      type="url"
                      name="actionUrl"
                      value={formData.actionUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Action Text (Optional)
                    </label>
                    <input
                      type="text"
                      name="actionText"
                      value={formData.actionText}
                      onChange={handleChange}
                      placeholder="e.g., View Details"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Schedule For (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Schedule For (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduleFor"
                    value={formData.scheduleFor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to send immediately
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium dark:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Spinner fullScreen={false} />
                        Creating...
                      </>
                    ) : (
                      "Create & Send Notification"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
};

export default Notifications;
