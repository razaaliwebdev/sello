import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { images } from "../../assets/assets";
import {
  FiArrowLeft,
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageCircle,
} from "react-icons/fi";
import { useGetMeQuery } from "../../redux/services/api";

const HelpArticlePage = ({ title, content, category }) => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetMeQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/help-center")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div
                onClick={() => navigate("/")}
                className="cursor-pointer flex items-center gap-3"
              >
                <img
                  src={images.logo}
                  alt="Sello Logo"
                  className="h-10 md:h-12"
                />
                <span className="text-xl font-bold text-primary-500 hidden md:block">
                  Help Center
                </span>
              </div>
            </div>

            <div
              onClick={() => navigate("/profile")}
              className="cursor-pointer flex items-center gap-2"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-gray-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="hidden md:block text-gray-700 font-medium">
                {currentUser?.name || "Guest"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="mb-6">
            {category && (
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-500 rounded-full text-sm font-medium mb-4">
                {category}
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
          </div>

          <div className="prose prose-lg max-w-none">{content}</div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Still need help?
            </h3>
            <div className="flex flex-col md:flex-row items-start gap-4">
              <button
                onClick={() => navigate("/contact")}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
              >
                <FiMessageCircle className="text-xl" />
                Contact Support
              </button>
              <a
                href="tel:+97145061300"
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiPhone className="text-xl" />
                +971 45 061 300
              </a>
              <a
                href="mailto:info@sello.ae"
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiMail className="text-xl" />
                info@sello.ae
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpArticlePage;
