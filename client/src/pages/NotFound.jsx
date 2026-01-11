import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Try to go back in React Router way
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="text-9xl font-bold text-primary-500">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-bold text-primary-300">404</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Oops! The page you're looking for seems to have gone missing. It might
          have been removed, renamed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <FaHome className="text-sm" />
            Go Home
          </Link>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            <FaArrowLeft className="text-sm" />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Looking for something?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/cars"
              className="flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FaSearch className="text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Browse Cars</div>
                <div className="text-sm text-gray-500">
                  Find your perfect vehicle
                </div>
              </div>
            </Link>

            <Link
              to="/about"
              className="flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <FaHome className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">About Us</div>
                <div className="text-sm text-gray-500">
                  Learn more about Sello
                </div>
              </div>
            </Link>

            <Link
              to="/contact"
              className="flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <FaHome className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Contact Support</div>
                <div className="text-sm text-gray-500">
                  Get help from our team
                </div>
              </div>
            </Link>

            <Link
              to="/help-center"
              className="flex items-center gap-3 text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <FaHome className="text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Help Center</div>
                <div className="text-sm text-gray-500">FAQs and guides</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please contact our support team at{" "}
          <a
            href="mailto:support@sello.pk"
            className="text-primary-500 hover:text-opacity-90 inline-block py-4 font-medium"
          >
            support@sello.pk
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
