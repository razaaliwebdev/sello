import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useGetFilteredCarsQuery } from "../../redux/services/api";
import { useVehicleCategories } from "../../hooks/useVehicleCategories";
import CarCard from "../../components/common/CarCard";
import FilterForm from "../../components/sections/filter/FilterForm";
import { FaCar, FaBus, FaTruck, FaMotorcycle, FaBolt } from "react-icons/fa6";
import { FaShuttleVan } from "react-icons/fa";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const categoryIcons = {
  Car: FaCar,
  Bus: FaBus,
  Truck: FaTruck,
  Van: FaShuttleVan,
  Bike: FaMotorcycle,
  "E-bike": FaBolt,
};

const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    categories,
    getCategoryBySlug,
    isLoading: categoriesLoading,
  } = useVehicleCategories();

  const category = getCategoryBySlug(slug);
  const categoryName =
    category?.name ||
    slug?.charAt(0).toUpperCase() + slug?.slice(1) ||
    "All Vehicles";

  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [filters, setFilters] = useState(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  });

  // Build query params
  const queryParams = {
    page,
    limit: 12,
    vehicleType: categoryName,
    ...filters,
  };

  const { data, isLoading, error } = useGetFilteredCarsQuery(queryParams);

  const cars = data?.cars || [];
  const total = data?.total || 0;
  const pages = data?.pages || 0;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const Icon = categoryIcons[categoryName] || FaCar;

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category && slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Category Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition"
          >
            <HiOutlineArrowLeft /> Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 mb-4 text-white/80 hover:text-white transition"
          >
            <HiOutlineArrowLeft /> Back to All Listings
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon className="text-4xl" />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-2">{categoryName}</h2>
              <p className="text-white/90">
                {category?.description ||
                  `Browse all ${categoryName.toLowerCase()} listings`}
              </p>
              {total > 0 && (
                <p className="text-white/80 mt-2">
                  {total} {total === 1 ? "listing" : "listings"} available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>
              <FilterForm onFilter={handleFilterChange} />
            </div>
          </div>

          {/* Listings */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading listings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">
                  Error loading listings. Please try again.
                </p>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Icon className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Listings Found
                </h3>
                <p className="text-gray-600 mb-6">
                  No {categoryName.toLowerCase()} listings match your filters.
                </p>
                <Link
                  to="/create-post"
                  className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  Post a Listing
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {cars.map((car) => (
                    <CarCard key={car._id} car={car} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`px-4 py-2 rounded-lg transition ${
                          page === p
                            ? "bg-primary-500 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
