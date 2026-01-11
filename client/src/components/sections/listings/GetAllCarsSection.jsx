import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { images } from "../../../assets/assets";
import { IoIosArrowRoundUp } from "react-icons/io";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FiZap } from "react-icons/fi";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { buildCarUrl } from "../../../utils/urlBuilders";
import {
  useGetCarsQuery,
  useGetMeQuery,
  useGetSavedCarsQuery,
  useSaveCarMutation,
  useUnsaveCarMutation,
} from "../../../redux/services/api";
import LazyImage from "../../common/LazyImage";
import { formatPrice } from "../../../utils/format";
import toast from "react-hot-toast";

// Skeleton Loader Component
const CarCardSkeleton = () => (
  <div className="md:px-6 md:py-8 bg-white rounded-lg shadow-sm animate-pulse">
    <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
    <div className="p-4">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between mb-4">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

// Safe capitalize function
// const capitalize = (str) => {
//   if (!str || typeof str !== "string") return "";
//   return str.charAt(0).toUpperCase() + str.slice(1);
// };

// capitalize();

const GetAllCarsSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [displayLimit, setDisplayLimit] = useState(12); // For Load More feature
  const [allLoadedCars, setAllLoadedCars] = useState([]); // Accumulate loaded cars
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Check if we're on home page or listing page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  const limit = isHomePage ? 6 : 12; // Show 6 on home, 12 on listing page
  const LOAD_MORE_THRESHOLD = 100; // Switch to pagination after 100 items

  // Get user data and saved cars
  const token = localStorage.getItem("token");
  const { isLoading: isLoadingUser, isError: isUserError } = useGetMeQuery(
    undefined,
    {
      skip: !token, // Skip if no token
    }
  );
  const { data: savedCarsData } = useGetSavedCarsQuery(undefined, {
    skip: !token || isLoadingUser || isUserError, // Only fetch if user is logged in
  });
  const [saveCar, { isLoading: isSaving }] = useSaveCarMutation();
  const [unsaveCar, { isLoading: isUnsaving }] = useUnsaveCarMutation();

  // Extract saved car IDs
  const savedCars = useMemo(() => {
    if (!savedCarsData || !Array.isArray(savedCarsData)) return [];
    return savedCarsData.map((car) => car._id || car.id).filter(Boolean);
  }, [savedCarsData]);

  // Get URL parameters
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  // Memoize query params to prevent unnecessary refetches
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      // Only apply condition filter if not 'all cars'
      ...(activeTab !== "all" && { condition: activeTab }),
      // Apply search term if present in URL
      ...(urlSearch && { search: urlSearch }),
    }),
    [page, activeTab, limit, urlSearch]
  );

  // Call backend with pagination and filtering
  const { data: carsData, isLoading, error } = useGetCarsQuery(queryParams);

  // Reset to first page and clear loaded cars when changing tabs
  useEffect(() => {
    setPage(1);
    setDisplayLimit(12);
    setAllLoadedCars([]);
  }, [activeTab]);

  // Accumulate cars when new data arrives (for Load More feature)
  useEffect(() => {
    if (carsData?.cars && Array.isArray(carsData.cars) && !isHomePage) {
      if (page === 1) {
        // First page - replace all
        setAllLoadedCars(carsData.cars);
        setDisplayLimit(12); // Reset display limit
      } else {
        // Subsequent pages - append (for Load More)
        setAllLoadedCars((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newCars = carsData.cars.filter(
            (c) => c?._id && !existingIds.has(c._id)
          );
          return [...prev, ...newCars];
        });
      }
      setIsLoadingMore(false);
    }
  }, [carsData?.cars, page, isHomePage]);

  // Cars data from API with fallback to empty array
  const cars = useMemo(() => {
    if (isHomePage) {
      // Home page - just show current page data
      return Array.isArray(carsData?.cars) ? carsData.cars : [];
    }

    // Listing page - use accumulated cars if under threshold
    const totalLoaded = allLoadedCars.length;
    if (totalLoaded > 0 && totalLoaded < LOAD_MORE_THRESHOLD) {
      // Load More mode - show up to displayLimit
      return allLoadedCars.slice(0, displayLimit);
    }

    // Pagination mode - use current page data
    return Array.isArray(carsData?.cars) ? carsData.cars : [];
  }, [carsData?.cars, allLoadedCars, displayLimit, isHomePage]);

  const totalPages = carsData?.pages || 1;
  const totalCars = carsData?.total || 0;
  const totalLoaded = allLoadedCars.length;

  // Determine if we should show Load More or Pagination
  const shouldShowLoadMore =
    !isHomePage &&
    totalLoaded > 0 &&
    totalLoaded < LOAD_MORE_THRESHOLD &&
    (displayLimit < totalLoaded ||
      (displayLimit < totalCars && page < totalPages));

  const shouldShowPagination =
    !isHomePage &&
    (totalLoaded >= LOAD_MORE_THRESHOLD || totalCars > LOAD_MORE_THRESHOLD) &&
    totalPages > 1;

  // Handle Load More
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const nextLimit = displayLimit + 12;

    // If we need more data and haven't reached threshold
    if (
      nextLimit > totalLoaded &&
      page < totalPages &&
      totalLoaded < LOAD_MORE_THRESHOLD
    ) {
      // Fetch next page
      setPage((prev) => prev + 1);
    } else {
      // Just increase display limit
      setDisplayLimit(nextLimit);
      setIsLoadingMore(false);
    }
  }, [displayLimit, totalLoaded, page, totalPages, isLoadingMore]);

  // Handle tab change with useCallback
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle page change with loading state
  // const handlePageChange = (newPage) => {
  //   if (newPage !== page) {
  //     setIsPageChanging(true);
  //     setPage(newPage);
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // };

  // handlePageChange();

  const toggleSave = useCallback(
    async (carId, e) => {
      e?.stopPropagation(); // Prevent navigation when clicking save button

      // Check token first - this is the most reliable check
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        toast.error("Please login to save cars");
        navigate("/login");
        return;
      }

      const isSaved = savedCars.includes(carId);

      try {
        if (isSaved) {
          await unsaveCar(carId).unwrap();
          toast.success("Car removed from saved list");
        } else {
          await saveCar(carId).unwrap();
          toast.success("Car saved successfully");
        }
      } catch (error) {
        // Check if it's an authentication error
        const errorStatus = error?.status || error?.data?.status;
        const errorMessage = error?.data?.message || error?.message || "";

        if (
          errorStatus === 401 ||
          errorStatus === 403 ||
          errorMessage.toLowerCase().includes("auth") ||
          errorMessage.toLowerCase().includes("login") ||
          errorMessage.toLowerCase().includes("unauthorized")
        ) {
          toast.error("Your session has expired. Please login again.");
          // Only clear token and redirect if it's actually an auth error
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          }, 1000);
        } else {
          toast.error(errorMessage || "Failed to update saved cars");
        }
      }
    },
    [savedCars, saveCar, unsaveCar, navigate]
  );

  // Define the available tabs - memoized
  const tabs = useMemo(
    () => [
      { id: "all", label: "All Cars" },
      { id: "new", label: "New Cars" },
      { id: "used", label: "Used Cars" },
    ],
    []
  );

  // Filter cars based on active tab (client-side fallback) - memoized
  // Note: Backend already filters by condition, but this is a safety fallback
  const filteredCars = useMemo(() => {
    if (activeTab === "all") return cars;
    return cars.filter(
      (car) => car.condition?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [cars, activeTab]);

  // Prevent rendering on search-results page to avoid conflicts
  if (
    location.pathname === "/search-results" ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
        <h1 className="md:text-4xl text-2xl font-medium mb-8">
          Explore All Vehicles
        </h1>
        <div className="grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-6">
          {[...Array(6)].map((_, index) => (
            <CarCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (error && carsData && carsData.length > 0) {
    // Extract error message from RTK Query error structure
    const errorMessage =
      error?.data?.message ||
      error?.message ||
      error?.error ||
      "Unknown error occurred";

    return (
      <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
        <div className="text-center">
          <h2 className="text-xl text-red-500 mb-4">Error loading cars</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate(0)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
      <div>
        <h1 className="md:text-4xl text-2xl font-medium">
          Explore All Vehicles
        </h1>

        {/* Tabs */}
        <div className="flex space-x-8 border-b mt-5 border-gray-200 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 text-lg font-medium text-[#0B0C1E] transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-[3px] border-[#FFB400]"
                  : "text-opacity-60 hover:text-opacity-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        {!isHomePage && totalCars > 0 && (
          <div className="my-4 text-sm text-gray-600 flex items-center justify-between">
            <span>
              Showing <span className="font-semibold">{cars.length}</span> of{" "}
              <span className="font-semibold">{totalCars}</span> vehicles
            </span>
            {shouldShowLoadMore && (
              <span className="text-xs text-gray-500">
                ({totalLoaded} loaded)
              </span>
            )}
          </div>
        )}

        {/* Cars Grid */}
        <div className="my-5 grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-6">
          {filteredCars.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              {activeTab === "all"
                ? "No cars available at the moment."
                : `No ${activeTab} cars found.`}
            </p>
          ) : (
            (isHomePage ? filteredCars.slice(0, 6) : filteredCars).map(
              (car, index) => {
                const carId = car?._id || index;
                const carImage = car?.images?.[0] || images.carPlaceholder;
                const carMake = car?.make || "Unknown Make";
                const carModel = car?.model || "Unknown Model";
                // Validate and format year
                const carYear =
                  car?.year &&
                  typeof car.year === "number" &&
                  car.year > 1900 &&
                  car.year < 2100
                    ? car.year
                    : "N/A";

                // Format price properly using utility function
                const carPrice = formatPrice(car?.price);

                return (
                  <div
                    className="md:px-6 md:py-8 bg-[#FFFFFF] rounded-lg shadow-sm"
                    key={carId}
                  >
                    <div className="w-full h-full border border-gray-100 rounded-bl-2xl rounded-br-2xl md:pb-8 pb-14">
                      <div className="h-48 relative">
                        <LazyImage
                          src={carImage}
                          alt={`${carMake} ${carModel}`}
                          className={`rounded-t-lg`}
                          width="100%"
                          height="100%"
                          onError={() => {
                            // This will be handled by the LazyImage component
                          }}
                        />
                        {/* Boost Badge */}
                        {car?.isBoosted &&
                          new Date(car?.boostExpiry) > new Date() && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10 flex items-center gap-1 shadow-lg">
                              <FiZap size={12} />
                              BOOSTED
                            </div>
                          )}
                        {/* Featured Badge */}
                        {car?.featured && (
                          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                            FEATURED
                          </div>
                        )}
                        {/* Verified Dealer Badge */}
                        {car?.postedBy?.role === "dealer" &&
                          car?.postedBy?.dealerInfo?.verified && (
                            <div
                              className={`absolute ${
                                car?.featured || car?.isBoosted
                                  ? "top-14"
                                  : "top-4"
                              } left-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10 flex items-center gap-1 shadow-lg`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              VERIFIED DEALER
                            </div>
                          )}
                        <button
                          onClick={(e) => toggleSave(carId, e)}
                          disabled={isSaving || isUnsaving}
                          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 z-10"
                          title={
                            savedCars.includes(carId)
                              ? "Remove from saved"
                              : "Save car"
                          }
                        >
                          {savedCars.includes(carId) ? (
                            <BsBookmarkFill className="text-primary-500 text-xl" />
                          ) : (
                            <BsBookmark className="text-gray-400 hover:text-primary-500 text-xl transition-colors" />
                          )}
                        </button>
                      </div>

                      <div className="p-5">
                        {/* Dealer Badge in Card */}
                        {car?.postedBy?.role === "dealer" &&
                          car?.postedBy?.dealerInfo &&
                          car?.postedBy?.dealerInfo?.verified && (
                            <div className="mb-2 flex items-center gap-1">
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-green-600">
                                {car?.postedBy?.dealerInfo?.businessName ||
                                  "Verified Dealer"}
                              </span>
                            </div>
                          )}
                        <h4 className="md:text-xl text-lg font-medium">
                          {carMake} {carModel} - {carYear}
                        </h4>
                        <p className="border-b border-gray-200 pb-1.5">
                          {Array.isArray(car?.features)
                            ? car.features.join(", ")
                            : car?.features || "No features listed"}
                        </p>

                        <div className="flex items-center my-3 justify-around border-b border-gray-200 pb-3">
                          <div className="flex items-center flex-col gap-2">
                            <LazyImage
                              src={images.milesIcon}
                              alt="Miles Icon"
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain"
                            />
                            {car?.mileage
                              ? `${car.mileage.toLocaleString()} km`
                              : "N/A"}
                          </div>
                          <div className="flex items-center flex-col gap-2">
                            <LazyImage
                              src={images.fuelTypeIcon}
                              alt="Fuel Icon"
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain"
                            />
                            {car?.fuelType || "N/A"}
                          </div>
                          <div className="flex items-center flex-col gap-2">
                            <LazyImage
                              src={images.transmissionIcon}
                              alt="Transmission Icon"
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain"
                            />
                            {car?.transmission || "N/A"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-2 md:text-xl font-medium text-lg">
                            AED <h5 className={`price`}>{carPrice}</h5>
                          </div>
                          <button
                            onClick={() => car && navigate(buildCarUrl(car))}
                            className={`flex items-center gap-2 text-primary-500`}
                          >
                            View Details
                            <IoIosArrowRoundUp className="text-2xl rotate-[43deg]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* View All Link - Show on home page when there are cars */}
        {isHomePage && filteredCars.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (activeTab !== "all") {
                  params.append("condition", activeTab);
                }
                navigate(`/cars?${params.toString()}`);
              }}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors font-medium flex items-center gap-2"
            >
              View All Vehicles
              <IoIosArrowRoundUp className="text-xl rotate-[40deg]" />
            </button>
          </div>
        )}

        {/* Load More Button - Show when under 100 items */}
        {shouldShowLoadMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  Load More ({Math.min(displayLimit, totalLoaded)} of{" "}
                  {totalLoaded >= LOAD_MORE_THRESHOLD ? totalCars : totalLoaded}
                  )
                  <IoIosArrowRoundUp className="text-xl rotate-[90deg]" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Pagination Controls - Show after 100 items or when total > 100 */}
        {shouldShowPagination && totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-10">
            {/* Page Numbers */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {/* First Page */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => {
                      setPage(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                  >
                    1
                  </button>
                  {page > 4 && <span className="px-2 text-gray-400">...</span>}
                </>
              )}

              {/* Previous Pages */}
              {page > 1 && page <= totalPages && (
                <>
                  {page > 2 && (
                    <button
                      onClick={() => {
                        setPage(page - 2);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                    >
                      {page - 2}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPage(page - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                  >
                    {page - 1}
                  </button>
                </>
              )}

              {/* Current Page */}
              <button
                className="px-4 py-2 border-2 border-primary-500 rounded-lg shadow-sm bg-primary-500 text-white font-medium"
                disabled
              >
                {page}
              </button>

              {/* Next Pages */}
              {page < totalPages && (
                <>
                  <button
                    onClick={() => {
                      setPage(page + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                  >
                    {page + 1}
                  </button>
                  {page < totalPages - 1 && (
                    <button
                      onClick={() => {
                        setPage(page + 2);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                    >
                      {page + 2}
                    </button>
                  )}
                </>
              )}

              {/* Last Page */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => {
                      setPage(totalPages);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors font-medium"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === 1}
                className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setPage((p) => Math.min(p + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === totalPages}
                className="px-6 py-2.5 border border-primary-500 rounded-lg shadow-sm bg-primary-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                Next
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default memo(GetAllCarsSection);
