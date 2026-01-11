import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMessageSquare,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiImage,
} from "react-icons/fi";
import {
  useGetCarChatsQuery,
  useGetCarChatMessagesQuery,
  useSendCarChatMessageMutation,
  useEditCarChatMessageMutation,
  useDeleteCarChatMessageMutation,
  useGetMeQuery,
} from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { useSocket } from "../../contexts/SocketContext";
import { buildCarUrl } from "../../utils/urlBuilders";

const MyChats = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const { socket, socketConnected } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const { data: currentUser } = useGetMeQuery();
  const {
    data: chats = [],
    isLoading: chatsLoading,
    refetch: refetchChats,
    error: chatsError,
  } = useGetCarChatsQuery(undefined, { pollingInterval: 5000 });
  // Use a longer polling interval - socket will handle real-time updates
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
    error: messagesError,
  } = useGetCarChatMessagesQuery(selectedChat, {
    skip: !selectedChat,
    // Fetch messages even if relying on socket events for real-time updates
    // This ensures we have initial message history and fallback for socket issues
    pollingInterval: 3000, // Reduced to 3 seconds for better responsiveness
  });
  const [sendMessage] = useSendCarChatMessageMutation();
  const [editMessage] = useEditCarChatMessageMutation();
  const [deleteMessage] = useDeleteCarChatMessageMutation();

  // Initialize Socket connection and event handlers
  useEffect(() => {
    if (!socket || !selectedChat) return;

    // Join the chat room when socket is connected and chat is selected
    if (socketConnected) {
      console.log("Joining chat room:", selectedChat);
      socket.emit("join-chat", selectedChat);
    }

    // Handle new messages
    const handleNewMessage = (data) => {
      console.log("New message received in MyChats:", data);
      if (data.chatId === selectedChat) {
        // Refetch messages with a small delay to ensure server has processed message
        setTimeout(() => {
          refetchMessages();
        }, 100);
        refetchChats(); // Update chat list for unread counts and last message
      }
    };

    // Handle message updates
    const handleMessageUpdated = (data) => {
      console.log("Message updated in MyChats:", data);
      if (data.chatId === selectedChat) {
        refetchMessages();
      }
    };

    // Handle message deletion
    const handleMessageDeleted = (data) => {
      console.log("Message deleted in MyChats:", data);
      if (data.chatId === selectedChat) {
        refetchMessages();
      }
    };

    // Handle socket reconnection
    const handleConnect = () => {
      console.log("Socket reconnected, re-joining chat:", selectedChat);
      if (selectedChat) {
        socket.emit("join-chat", selectedChat);
      }
    };

    // Set up event listeners
    socket.on("new-message", handleNewMessage);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("connect", handleConnect);

    return () => {
      // Clean up event listeners
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("connect", handleConnect);
    };
  }, [socket, socketConnected, selectedChat, refetchMessages, refetchChats]);

  // Track user scroll to determine if we should auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedChat]);

  // Auto scroll to bottom only if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages]);

  // Auto select first chat
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]._id);
    }
  }, [chats, selectedChat]);

  // Handle errors
  useEffect(() => {
    if (chatsError) {
      const errorMessage =
        chatsError?.data?.message ||
        chatsError?.message ||
        "Failed to load chats";
      if (!errorMessage.includes("Cannot connect")) {
        toast.error(errorMessage);
      }
    }
  }, [chatsError]);

  useEffect(() => {
    if (messagesError) {
      const errorMessage =
        messagesError?.data?.message ||
        messagesError?.message ||
        "Failed to load messages";
      if (!errorMessage.includes("Cannot connect")) {
        toast.error(errorMessage);
      }
    }
  }, [messagesError]);

  const getOtherParticipant = (chat) => {
    if (!currentUser || !chat.participants) return null;
    return chat.participants.find(
      (p) => p._id.toString() !== currentUser._id.toString()
    );
  };

  const getUnreadCount = (chat) => {
    if (!currentUser || !chat.unreadCount) return 0;
    const unread = chat.unreadCount[currentUser._id] || 0;
    return unread;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    const messageText = message.trim();
    setMessage("");

    console.log("Sending message:", {
      selectedChat,
      messageText,
      socketConnected,
    });

    try {
      if (socket && socket.connected) {
        console.log("Sending via socket");
        socket.emit("send-message", {
          chatId: selectedChat,
          message: messageText,
          messageType: "text",
        });
        refetchChats();
      } else {
        console.log("Sending via REST API (socket not connected)");
        await sendMessage({
          chatId: selectedChat,
          message: messageText,
        }).unwrap();
        refetchMessages();
        refetchChats();
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error?.data?.message || "Failed to send message");
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editMessageText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      await editMessage({
        messageId,
        message: editMessageText.trim(),
      }).unwrap();
      setEditingMessageId(null);
      setEditMessageText("");
      refetchMessages();
      toast.success("Message updated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      await deleteMessage(messageId).unwrap();
      refetchMessages();
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete message");
    }
  };

  const selectedChatData = chats.find((c) => c._id === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft />
            <span>Back</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-900">My Chats</h2>
          <p className="text-gray-600 mt-1">
            Manage your buyer and seller conversations
          </p>
        </div>

        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="flex h-full">
            {/* Sidebar - Chat List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-primary-50">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
                {socketConnected && (
                  <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Live
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {chatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner fullScreen={false} />
                  </div>
                ) : chatsError ? (
                  <div className="text-center text-red-500 py-8 px-4">
                    <p className="font-semibold">Error loading chats</p>
                    <p className="text-sm mt-2">
                      {chatsError?.data?.message ||
                        chatsError?.message ||
                        "Please check your connection and try again"}
                    </p>
                    <button
                      onClick={() => refetchChats()}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                    >
                      Retry
                    </button>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 px-4">
                    <FiMessageSquare
                      size={48}
                      className="mx-auto mb-3 text-gray-400"
                    />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">
                      Start chatting with sellers or buyers!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {chats.map((chat) => {
                      const otherUser = getOtherParticipant(chat);
                      const unreadCount = getUnreadCount(chat);
                      const isSelected = selectedChat === chat._id;

                      return (
                        <div
                          key={chat._id}
                          onClick={() => setSelectedChat(chat._id)}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary-50 border-l-4 border-primary-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                              {otherUser?.avatar ? (
                                <img
                                  src={otherUser.avatar}
                                  alt={otherUser?.name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (otherUser?.name || "U").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 truncate">
                                  {otherUser?.name || "Unknown User"}
                                </p>
                                {unreadCount > 0 && (
                                  <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              {chat.car && (
                                <p className="text-sm text-gray-600 truncate mb-1">
                                  {chat.car.title ||
                                    `${chat.car.make} ${chat.car.model}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 truncate">
                                {chat.lastMessage || "No messages yet"}
                              </p>
                              {chat.lastMessageAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(
                                    chat.lastMessageAt
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChatData ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-primary-50">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const otherUser = getOtherParticipant(selectedChatData);
                        return (
                          <>
                            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                              {otherUser?.avatar ? (
                                <img
                                  src={otherUser.avatar}
                                  alt={otherUser?.name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (otherUser?.name || "U").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {otherUser?.name || "Unknown User"}
                              </h3>
                              {selectedChatData.car && (
                                <p className="text-sm text-gray-600">
                                  {selectedChatData.car.title ||
                                    `${selectedChatData.car.make} ${selectedChatData.car.model}`}
                                </p>
                              )}
                            </div>
                            {selectedChatData.car && (
                              <button
                                onClick={() =>
                                  navigate(buildCarUrl(selectedChatData.car))
                                }
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 text-sm"
                              >
                                View Car
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 bg-[#ECE5DD] space-y-3"
                  >
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner fullScreen={false} />
                      </div>
                    ) : messagesError ? (
                      <div className="text-center text-red-500 py-8">
                        <p className="font-semibold">Error loading messages</p>
                        <p className="text-sm mt-2">
                          {messagesError?.data?.message ||
                            messagesError?.message ||
                            "Please check your connection and try again"}
                        </p>
                        <button
                          onClick={() => refetchMessages()}
                          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                        >
                          Retry
                        </button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages
                        .filter((msg) => !msg.isDeleted)
                        .map((msg) => {
                          const isCurrentUser =
                            currentUser?._id &&
                            msg.sender?._id &&
                            currentUser._id.toString() ===
                              msg.sender._id.toString();
                          const canEdit = isCurrentUser && !msg.isDeleted;
                          const canDelete = isCurrentUser && !msg.isDeleted;

                          return (
                            <div
                              key={msg._id}
                              className={`flex mb-4 ${
                                isCurrentUser ? "justify-start" : "justify-end"
                              } group`}
                            >
                              <div
                                className={`flex items-end gap-2 max-w-[80%] ${
                                  isCurrentUser
                                    ? "flex-row"
                                    : "flex-row-reverse"
                                }`}
                              >
                                {isCurrentUser && (
                                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                    {msg.sender?.avatar ? (
                                      <img
                                        src={msg.sender.avatar}
                                        alt={msg.sender?.name || "User"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (msg.sender?.name || "U")
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                  </div>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isCurrentUser
                                      ? "bg-primary-500 text-white rounded-bl-sm"
                                      : "bg-white text-gray-800 rounded-br-sm border border-gray-200"
                                  } shadow-sm`}
                                >
                                  {!isCurrentUser && (
                                    <p className="text-xs font-semibold mb-1 text-gray-700">
                                      {msg.sender?.name || "User"}
                                    </p>
                                  )}
                                  {editingMessageId === msg._id ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={editMessageText}
                                        onChange={(e) =>
                                          setEditMessageText(e.target.value)
                                        }
                                        className="w-full px-2 py-1 bg-white text-gray-800 rounded border"
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") {
                                            handleEditMessage(msg._id);
                                          }
                                        }}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleEditMessage(msg._id)
                                          }
                                          className="text-xs px-2 py-1 bg-white text-primary-500 rounded hover:bg-gray-100"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingMessageId(null);
                                            setEditMessageText("");
                                          }}
                                          className="text-xs px-2 py-1 bg-white text-gray-600 rounded hover:bg-gray-100"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {msg.message}
                                      </p>
                                      {msg.isEdited && (
                                        <p className="text-xs italic mt-1 opacity-75">
                                          (edited)
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <div
                                    className={`flex items-center gap-1 mt-1 ${
                                      isCurrentUser
                                        ? "justify-start"
                                        : "justify-end"
                                    }`}
                                  >
                                    <span
                                      className={`text-xs ${
                                        isCurrentUser
                                          ? "text-primary-100"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {new Date(
                                        msg.createdAt
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {canEdit && (
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(msg._id);
                                          setEditMessageText(msg.message);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 ml-1 text-white hover:text-primary-200"
                                        title="Edit message"
                                      >
                                        <FiEdit2 size={12} />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(msg._id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 ml-1 text-white hover:text-primary-200"
                                        title="Delete message"
                                      >
                                        <FiTrash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!isCurrentUser && (
                                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                    {msg.sender?.avatar ? (
                                      <img
                                        src={msg.sender.avatar}
                                        alt={msg.sender?.name || "User"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (msg.sender?.name || "U")
                                        .charAt(0)
                                        .toUpperCase()
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiSend />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FiMessageSquare
                      size={64}
                      className="mx-auto mb-4 text-gray-400"
                    />
                    <p className="text-lg">
                      Select a conversation to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyChats;
