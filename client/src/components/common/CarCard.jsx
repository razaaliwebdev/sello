import React from "react";
import { useNavigate } from "react-router-dom";
import { buildCarUrl } from "../../utils/urlBuilders";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import LazyImage from "./LazyImage";
import { images } from "../../assets/assets";
import {
  useSaveCarMutation,
  useUnsaveCarMutation,
  useGetSavedCarsQuery,
  useGetMeQuery,
} from "../../redux/services/api";
import toast from "react-hot-toast";

const CarCard = ({ car }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [saveCar, { isLoading: isSaving }] = useSaveCarMutation();
  const [unsaveCar, { isLoading: isUnsaving }] = useUnsaveCarMutation();

  // Get saved cars from API if user is logged in
  const { data: savedCarsData } = useGetSavedCarsQuery(undefined, {
    skip: !token,
  });

  // Extract saved car IDs
  const savedCars = React.useMemo(() => {
    if (!savedCarsData || !Array.isArray(savedCarsData)) return [];
    return savedCarsData.map((car) => car._id || car.id).filter(Boolean);
  }, [savedCarsData]);

  const carId = car?._id;
  const carImage = car?.images?.[0] || images.carPlaceholder;
  const carMake = car?.make || "Unknown Make";
  const carModel = car?.model || "Unknown Model";
  const carYear = car?.year || "N/A";
  const carPrice = car?.price?.toLocaleString() || "N/A";
  const isSaved = savedCars.includes(carId);

  const toggleSave = async (e) => {
    e.stopPropagation();
    if (!token) {
      toast.error("Please login to save cars");
      navigate("/login");
      return;
    }

    try {
      if (isSaved) {
        await unsaveCar(carId).unwrap();
        toast.success("Car removed from saved");
      } else {
        await saveCar(carId).unwrap();
        toast.success("Car saved successfully");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update saved cars");
    }
  };

  const handleCardClick = () => {
    navigate(buildCarUrl(car));
  };

  return (
    <div
      className="md:px-6 md:py-8 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="w-full h-full border border-gray-100 rounded-bl-2xl rounded-br-2xl md:pb-8 pb-14">
        <div className="h-48 relative">
          <LazyImage
            src={carImage}
            alt={`${carMake} ${carModel}`}
            className={`rounded-t-lg ${car?.isSold ? "opacity-60" : ""}`}
            width="100%"
            height="100%"
          />
          {/* Sold Badge */}
          {car?.isSold && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
              SOLD
            </div>
          )}
          {/* Featured Badge */}
          {car?.featured && !car?.isSold && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
              FEATURED
            </div>
          )}
          {/* Verified Dealer Badge */}
          {car?.postedBy?.role === "dealer" &&
            car?.postedBy?.dealerInfo?.verified &&
            !car?.isSold && (
              <div
                className={`absolute ${
                  car?.featured ? "top-14" : "top-4"
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
            onClick={toggleSave}
            disabled={isSaving || isUnsaving}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 z-10"
            title={isSaved ? "Remove from saved" : "Save car"}
          >
            {isSaved ? (
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
                  {car?.postedBy?.dealerInfo?.businessName || "Verified Dealer"}
                </span>
              </div>
            )}
          <h4 className="md:text-xl text-lg font-medium">
            {carMake} {carModel} - {carYear}
          </h4>
          <p className="border-b border-gray-200 pb-1.5">
            {(() => {
              const features = car?.features;
              if (Array.isArray(features)) {
                return features.length > 0
                  ? features.slice(0, 3).join(", ")
                  : "No features listed";
              } else if (typeof features === "string") {
                return features.trim() ? features : "No features listed";
              } else {
                return "No features listed";
              }
            })()}
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
              {car?.mileage || "N/A"} km
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
            <div className="flex items-center flex-col gap-2">
              <LazyImage
                src={images.fuelIcon}
                alt="Fuel Icon"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              {car?.fuelType || "N/A"}
            </div>
          </div>

          <div className="flex items-center my-3 justify-around pb-3">
            <div className="flex items-center flex-col gap-2">
              <LazyImage
                src={images.door}
                alt="Doors Icon"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              {car?.carDoors || "N/A"} Doors
            </div>
            <div className="flex items-center flex-col gap-2">
              <LazyImage
                src={images.hp}
                alt="Horsepower Icon"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              {car?.horsepower ? `${car.horsepower} HP` : "N/A"}
            </div>
            <div className="flex items-center flex-col gap-2">
              <LazyImage
                src={images.cc}
                alt="Engine Icon"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              {car?.engineCapacity ? `${car.engineCapacity} CC` : "N/A"}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-primary-500">${carPrice}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildCarUrl(car));
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
