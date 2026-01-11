import React, { memo, useMemo } from "react";
import BrandMarquee from "../../BrandMarquee";
import { Link, useNavigate } from "react-router-dom";
import { brandsCategory } from "../../../assets/assets";
import RecentlyViewedCars from "./RecentlyViewedCars";
// import brands from "../../../assets/carLogos/brands";

const BrandsSection = () => {
  const navigate = useNavigate();

  const categoryMeta = useMemo(
    () => ({
      Car: {
        slug: "car",
        description: "Cars, sedans, SUVs, and other passenger vehicles",
      },
      Bus: {
        slug: "bus",
        description: "Buses and commercial passenger vehicles",
      },
      Truck: {
        slug: "truck",
        description: "Trucks and heavy-duty vehicles",
      },
      Van: {
        slug: "van",
        description: "Vans and utility vehicles",
      },
      Bike: {
        slug: "bike",
        description: "Motorcycles and bikes",
      },
      "E-Bike": {
        slug: "e-bike",
        description: "Electric bikes and scooters",
      },
    }),
    []
  );

  const handleCategoryClick = (title) => {
    const meta = categoryMeta[title];
    if (meta?.slug) {
      navigate(`/category/${meta.slug}`);
    }
  };

  return (
    <section className="bg-[#F5F5F5] w-full px-3 sm:px-4 md:px-6 lg:px-8 md:py-8 md:rounded-tl-[80px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Explore Our Premium Brands
        </h2>
        <Link
          to={"/view-all-brands"}
          className="text-primary-500 text-sm md:text-md hover:underline"
        >
          Show All Brands
        </Link>
      </div>
      {/* BrandMarquee will fetch brands from admin categories automatically */}
      <BrandMarquee />

      {/* Recently Viewed Cars and Brand Categories Grid */}
      <div className="py-5 md:w-[70%]">
        <div className="grid md:grid-cols-4 grid-cols-2 gap-6">
          {/* Brand Categories */}
          {brandsCategory.map((brand, index) => {
            const isLastItem = index === brandsCategory.length - 1;
            const isOddNumberOfItems = brandsCategory.length % 2 !== 0;
            const meta = categoryMeta[brand.title];

            return (
              <button
                type="button"
                className={`
          bg-white shadow-xl shadow-gray-200 flex flex-col items-center justify-center rounded-2xl
          ${isLastItem && isOddNumberOfItems ? "md:col-span-2 col-span-2" : ""}
          transition shadow-sm hover:shadow-md
        `}
                key={index}
                onClick={() => handleCategoryClick(brand.title)}
                disabled={!meta?.slug}
              >
                <img
                  className="md:h-28 md:w-28"
                  src={brand.image}
                  alt="brand"
                  loading="lazy"
                />
                <span className="pb-1 text-xl font-semibold text-gray-800">
                  {brand.title}
                </span>
                {meta?.description && (
                  <span className="pb-3 px-4 text-sm text-gray-600 text-center leading-snug">
                    {meta.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Viewed Cars - Full width section */}
      <RecentlyViewedCars />

      {/* ad */}
      <div className="ad"></div>
    </section>
  );
};

export default memo(BrandsSection);
