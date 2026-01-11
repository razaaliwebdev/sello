import React, { useEffect, useRef, useState } from "react";
import {
  ourStoryData,
  selloGroupData,
} from "../../../assets/about/aboutAssets";
import { FiUsers, FiTrendingUp } from "react-icons/fi";
import { FaCar, FaYoutube, FaGlobe } from "react-icons/fa";
import { HiNewspaper } from "react-icons/hi";

const OutStorySection = () => {
  const [isVisible, setIsVisible] = useState({ story: false, group: false });
  const storyRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === storyRef.current) {
              setIsVisible((prev) => ({ ...prev, story: true }));
            } else if (entry.target === groupRef.current) {
              setIsVisible((prev) => ({ ...prev, group: true }));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    if (storyRef.current) observer.observe(storyRef.current);
    if (groupRef.current) observer.observe(groupRef.current);

    return () => {
      if (storyRef.current) observer.unobserve(storyRef.current);
      if (groupRef.current) observer.unobserve(groupRef.current);
    };
  }, []);

  const stats = [
    { value: "1M+", label: "Customers", icon: FiUsers },
    { value: "50%", label: "Growth", icon: FiTrendingUp },
    { value: "1M+", label: "Cars Bought", icon: FaCar },
  ];

  const groupStats = [
    { value: "1.1M+", label: "YouTube Views", icon: FaYoutube },
    { value: "1.2M", label: "Magazine Copies", icon: HiNewspaper },
    { value: "2M+", label: "Website Visits", icon: FaGlobe },
  ];

  return (
    <div className="py-20 md:py-28 px-3 sm:px-4 md:px-6 lg:px-8 w-full bg-white">
      {/* Our Story */}
      <div
        ref={storyRef}
        className={`flex flex-col md:flex-row gap-12 md:gap-16 lg:gap-20 justify-between items-center md:items-start transition-all duration-1000 mb-24 md:mb-32 ${
          isVisible.story
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Text */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="inline-block mb-3">
            <span className="text-primary-500 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-primary-500/10 rounded-full">
              Our Journey
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
            {ourStoryData.title}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
          <p className="text-base md:text-lg lg:text-xl mt-8 leading-relaxed text-gray-700 font-medium">
            {ourStoryData.description}
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-6 mt-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-primary-500 mb-2">
                    <stat.icon className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-primary-500 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="w-full md:w-[40%] border-2 border-primary-500 rounded-tr-[40px] rounded-bl-[40px] ">
          <img
            src={ourStoryData.img}
            className="h-full w-full object-cover"
            alt="Our Story"
          />
        </div>
      </div>

      {/* Sello Group */}
      <div
        ref={groupRef}
        className={`flex flex-col md:flex-row-reverse gap-12 md:gap-16 lg:gap-20 justify-between items-center md:items-start transition-all duration-1000 ${
          isVisible.group
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Text */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="inline-block mb-3">
            <span className="text-primary-500 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-primary-500/10 rounded-full">
              Our Group
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
            {selloGroupData.title}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
          <p className="text-base md:text-lg lg:text-xl mt-8 leading-relaxed text-gray-700 font-medium">
            {selloGroupData.description}
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-6 mt-10">
            {groupStats.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-primary-500 mb-2">
                    <stat.icon className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-primary-500 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="w-full md:w-[40%] border-2 border-primary-500 rounded-br-[40px] ">
          <img
            src={selloGroupData.img}
            className="h-full w-full object-cover"
            alt="Our Story"
          />
        </div>
      </div>
    </div>
  );
};

export default OutStorySection;
