import React from "react";
import ceoImage from "../../../assets/images/team/ceo.jpg";
import contentWriterImage from "../../../assets/images/team/contentWriter.jpeg";
import managingDirectorImage from "../../../assets/images/team/managingDirector.jpeg";
import graphicDesignerImage from "../../../assets/images/team/graphicDesigner.jpeg";
import generalManagerImage from "../../../assets/images/team/generalManager.jpeg";
import developerImage from "../../../assets/images/team/developer.png";

const OurTeam = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Muhammad Adnan Amin",
      position: "Founder & CEO",
      description:
        "Leading Sello's vision and growth strategy with over 15 years of experience in automotive industry and digital transformation.",
      image: ceoImage,
    },
    {
      id: 2,
      name: "Warda Hashmi",
      position: "Content Writer",
      description:
        "Creating compelling content and stories that showcase our brand vision and connect with our audience through engaging narratives.",
      image: contentWriterImage,
    },
    {
      id: 3,
      name: "Faisal Zakria",
      position: "Managing Director",
      description:
        "Overseeing daily operations and strategic initiatives to ensure smooth business execution and sustainable growth for organization.",
      image: managingDirectorImage,
    },
    {
      id: 4,
      name: "Zain Riaz",
      position: "General Manager",
      description:
        "Driving sales growth and building strong client relationships with strategic market analysis and team leadership expertise.",
      image: generalManagerImage,
    },
    {
      id: 5,
      name: "Haris Mujahid",
      position: "Graphic Designer",
      description:
        "Creating stunning visual designs and brand identities that captivate audiences and communicate our brand message effectively.",
      image: graphicDesignerImage,
    },
    {
      id: 6,
      name: "Raza Ali",
      position: "Full Stack Software Developer",
      description:
        "Building robust and scalable web applications with modern technologies and innovative solutions to drive digital transformation.",
      image: developerImage,
    },
  ];

  return (
    <div className="py-16 lg:py-28 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="text-primary-600 font-semibold text-xs uppercase tracking-widest px-6 py-3 bg-primary-50 rounded-full border border-primary-100">
              Meet The Team
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Our Team
          </h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-24 h-0.5 bg-primary-500 rounded-full"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <div className="w-24 h-0.5 bg-primary-500 rounded-full"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
            The passionate people behind Sello's success
          </p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden max-w-sm mx-auto transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

              {/* Top Section - Enhanced Gradient Background */}
              <div className="relative h-72 flex items-center justify-center">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                  <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/15 rounded-full blur-2xl"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Profile Picture with Enhanced Styling */}
                <div className="relative z-10 w-full h-full rounded transform group-hover:scale-105 transition-transform duration-300">
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover  transform group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>

              {/* Enhanced Content Section */}
              <div className="relative p-6 pt-4 text-center">
                {/* Name with Better Typography */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight tracking-tight group-hover:text-primary-500 transition-colors duration-300">
                  {member.name.toUpperCase()}
                </h3>

                {/* Position Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-primary-50 border border-primary-300 rounded-full mb-4">
                  <span className="text-sm font-semibold text-primary-500">
                    {member.position}
                  </span>
                </div>

                {/* Description with Better Readability */}
                <p className="text-sm text-gray-600 mb-6 leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">
                  {member.description}
                </p>

                {/* Enhanced Tag */}
                <div className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-wider">
                  Creative at Sello
                </div>

                {/* Enhanced Social Media Icons */}
                <div className="flex justify-center gap-3">
                  <div className="group/icon w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-110">
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover/icon:text-white transition-colors duration-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div className="group/icon w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-sky-400 hover:to-blue-500 hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-110">
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover/icon:text-white transition-colors duration-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </div>
                  <div className="group/icon w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-800 hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-110">
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover/icon:text-white transition-colors duration-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurTeam;
