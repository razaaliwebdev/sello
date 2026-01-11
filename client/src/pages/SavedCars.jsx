import React from "react";
import {
  useGetSavedCarsQuery,
  useSaveCarMutation,
  useUnsaveCarMutation,
} from "../redux/services/api";
import { useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { IoIosArrowRoundUp } from "react-icons/io";
import LazyImage from "../components/common/LazyImage";
import { images } from "../assets/assets";
import toast from "react-hot-toast";
import { buildCarUrl } from "../utils/urlBuilders";

const SavedCars = () => {
  const navigate = useNavigate();
  const { data: savedCars, isLoading, refetch } = useGetSavedCarsQuery();
  const [saveCar] = useSaveCarMutation();
  const [unsaveCar] = useUnsaveCarMutation();

  const handleUnsave = async (carId, e) => {
    e?.stopPropagation();
    try {
      await unsaveCar(carId).unwrap();
      toast.success("Car removed from saved list");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove car");
    }
  };

  const cars = savedCars || [];

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 md:px-16 py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-8">Saved Cars</h2>

        {isLoading ? (
          <div className="grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="md:px-6 md:py-8 bg-white rounded-lg shadow-sm animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BsBookmark className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No Saved Cars
            </h2>
            <p className="text-gray-500 mb-6">
              You haven't saved any cars yet. Start exploring and save your
              favorites!
            </p>
            <button
              onClick={() => navigate("/cars")}
              className="bg-primary-500 hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-6">
            {cars.map((car) => {
              const carId = car._id || car.id;
              const carImage =
                car?.images?.[0] ||
                images?.carPlaceholder ||
                "https://via.placeholder.com/400x300?text=No+Image";
              const carMake = car?.make || "Unknown";
              const carModel = car?.model || "Unknown";
              const carYear = car?.year || "N/A";
              const carPrice = car?.price?.toLocaleString() || "N/A";
              const carMileage = car?.mileage || "N/A";
              const carFuelType = car?.fuelType || "N/A";
              const carTransmission = car?.transmission || "N/A";
              const carTitle = car?.title || `${carMake} ${carModel}`;

              return (
                <div
                  key={carId}
                  className="md:px-6 md:py-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-full border border-gray-100 rounded-bl-2xl rounded-br-2xl md:pb-8 pb-14">
                    <div className="h-48 relative">
                      <LazyImage
                        src={carImage}
                        alt={carTitle}
                        className="rounded-t-lg"
                        width="100%"
                        height="100%"
                        onError={(e) => {
                          e.target.src =
                            images?.carPlaceholder ||
                            "https://via.placeholder.com/400x300?text=No+Image";
                        }}
                      />
                      {car?.isSold && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                          SOLD
                        </div>
                      )}
                      <button
                        onClick={(e) => handleUnsave(carId, e)}
                        className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                        title="Remove from saved"
                      >
                        <BsBookmarkFill className="text-primary-500 text-xl" />
                      </button>
                    </div>

                    <div className="p-5">
                      <h4 className="md:text-xl text-lg font-medium">
                        {carMake} {carModel} - {carYear}
                      </h4>
                      <p className="border-b border-gray-200 pb-1.5">
                        {Array.isArray(car?.features)
                          ? car.features.join(", ")
                          : car?.features || "No features listed"}
                      </p>

                      <div className="flex items-center my-3 justify-around border-b border-gray-200 pb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={images?.milesIcon}
                            alt="miles"
                            className="w-5 h-5"
                          />
                          <span className="text-sm">{carMileage} km</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={images?.fuelTypeIcon}
                            alt="fuel"
                            className="w-5 h-5"
                          />
                          <span className="text-sm">{carFuelType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={images?.transmissionIcon}
                            alt="transmission"
                            className="w-5 h-5"
                          />
                          <span className="text-sm">{carTransmission}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <h6 className="text-lg md:text-xl font-semibold">
                          PKR {carPrice}
                        </h6>
                        <button
                          onClick={() => car && navigate(buildCarUrl(car))}
                          className="flex items-center gap-2 text-primary-500 hover:underline text-sm md:text-base"
                        >
                          View Details
                          <IoIosArrowRoundUp className="text-xl rotate-[40deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedCars;
