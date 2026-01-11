import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { images } from "../../assets/assets";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageCircle,
} from "react-icons/fi";
import { useGetMeQuery } from "../../redux/services/api";

const FAQs = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useGetMeQuery();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I create an account?",
      answer:
        "Click on 'Sign Up' in the top right corner, enter your email and password, verify your email, and complete your profile setup.",
    },
    {
      question: "How do I post a car for sale?",
      answer:
        "Log in to your account, click 'Post Ad' or 'Create Post', fill in all vehicle details, upload photos, and publish your listing.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept credit/debit cards (Visa, Mastercard) and bank transfers for subscriptions and premium features.",
    },
    {
      question: "How do I contact a seller?",
      answer:
        "Click on any listing to view details, then use the 'Call', 'Chat', or 'Message' buttons to contact the seller directly.",
    },
    {
      question: "Can I edit my listing after posting?",
      answer:
        "Yes, you can edit your listing anytime from the 'My Listings' section in your profile. Click on the listing and select 'Edit'.",
    },
    {
      question: "How do I boost my listing?",
      answer:
        "Go to your listing, click 'Boost' or 'Promote', choose a boost package, and complete the payment. Boosted listings appear at the top of search results.",
    },
    {
      question: "What should I do if I find a suspicious listing?",
      answer:
        "Report it immediately using the 'Report' button on the listing page, or contact our support team at info@sello.ae.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "Go to your Profile → Subscription section, click 'Cancel Auto-Renewal'. Your subscription will remain active until the end of the billing period.",
    },
    {
      question: "Can I save listings to view later?",
      answer:
        "Yes, click the heart icon on any listing to save it. View all saved listings in the 'Saved Cars' section of your profile.",
    },
    {
      question: "How do I delete my account?",
      answer:
        "Contact our support team at info@sello.ae with your account details, and we'll assist you with account deletion.",
    },
  ];

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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Still have questions?
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

export default FAQs;
