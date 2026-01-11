import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import FilterResultsSection from "../../components/sections/filter/FilterResultsSection";
import SortAndViewOptions from "../../components/listings/SortAndViewOptions";
import { FiX, FiFilter } from "react-icons/fi";
import Breadcrumb from "../../components/common/Breadcrumb";
import { useGetFilteredCarsQuery } from "../../redux/services/api";

const FilteredResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  // Get search term from URL params (navbar search)
  const searchTerm = searchParams.get("search") || "";

  // Redirect to home if no valid search parameters
  useEffect(() => {
    const hasValidParams = Array.from(searchParams.entries()).some(
      ([, value]) => value && value.trim() !== ""
    );

    if (!hasValidParams) {
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  // Build query parameters based on URL params only
  const queryParams = useMemo(() => {
    // Build filters from URL params
    const urlFilters = {};
    searchParams.forEach((value, key) => {
      if (value && value.trim() !== "") {
        urlFilters[key] = value;
      }
    });

    // If we have any URL params, use them
    if (Object.keys(urlFilters).length > 0) {
      return { ...urlFilters, limit: 50, page: 1 };
    }

    // No filters
    return null;
  }, [searchParams]);

  // Fetch data using the correct query parameters
  const { data: apiResults, isLoading: apiLoading } = useGetFilteredCarsQuery(
    queryParams,
    { skip: !queryParams }
  );

  // Use API results only (ignore state to fix navigation issues)
  const carsData = apiResults;
  const carsLoading = apiLoading;

  // Sort cars based on selected option
  const sortedCars = useMemo(() => {
    if (!carsData?.cars || !Array.isArray(carsData.cars)) return [];

    const cars = [...carsData.cars];

    switch (sortBy) {
      case "price-low":
        return cars.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return cars.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "year-new":
        return cars.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "year-old":
        return cars.sort((a, b) => (a.year || 0) - (b.year || 0));
      case "mileage-low":
        return cars.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case "mileage-high":
        return cars.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
      case "oldest":
        return cars.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
      case "newest":
      default:
        return cars.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
  }, [carsData?.cars, sortBy]);

  const activeFilters = useMemo(() => {
    const filters = [];
    searchParams.forEach((value, key) => {
      if (value && value !== "") {
        filters.push([key, value]);
      }
    });
    return filters;
  }, [searchParams]);

  const totalResults = carsData?.total || 0;

  // Show loading while search is loading (for direct navigation)
  if (carsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Home", path: "/" },
    { label: "Search Results", path: "/search-results" },
  ];

  const removeFilter = (keyToRemove) => {
    // Remove filter from URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(keyToRemove);

    // Navigate with updated params
    const newUrl = newParams.toString()
      ? `/search-results?${newParams.toString()}`
      : `/search-results`;

    navigate(newUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {searchTerm
              ? `Search Results for "${searchTerm}"`
              : "Search Results"}
          </h2>
          {searchTerm && (
            <p className="text-gray-600">
              Found {totalResults} {totalResults === 1 ? "car" : "cars"}{" "}
              matching your search
            </p>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FiFilter size={16} />
                Active Filters
              </h3>
              <button
                onClick={() => navigate("/filter")}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 bg-primary-50 text-primary-500 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}: {value}
                  </span>
                  <button
                    onClick={() => removeFilter(key)}
                    className="hover:text-primary-500"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sort and View Options */}
        {totalResults > 0 && (
          <SortAndViewOptions
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewChange={setViewMode}
            totalResults={totalResults}
          />
        )}

        {/* Results */}
        {totalResults > 0 ? (
          <FilterResultsSection
            filteredCars={{ ...carsData, cars: sortedCars }}
            isLoading={carsLoading}
            viewMode={viewMode}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm
                ? `No results found for "${searchTerm}"`
                : "No cars found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search terms or browse all cars"
                : "Check back later for new listings"}
            </p>
            {searchTerm && (
              <button
                onClick={() => navigate("/")}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Browse All Cars
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilteredResults;
