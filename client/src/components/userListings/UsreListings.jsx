import React, { useState } from "react";
import { IoIosArrowRoundUp } from "react-icons/io";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { buildCarUrl } from "../../utils/urlBuilders";
import {
  useGetMyCarsQuery,
  useRelistCarMutation,
} from "../../redux/services/api";
import LazyImage from "../../components/common/LazyImage";
import { images } from "../../assets/assets";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@redux/config";

const UserListings = () => {
  const navigate = useNavigate();
  const [statusFilter, _setStatusFilter] = useState("all"); // 'all', 'active', 'sold', 'expired'
  const {
    data,
    isLoading,
    error: listingsError,
    refetch,
  } = useGetMyCarsQuery(statusFilter !== "all" ? { status: statusFilter } : {});
  const [savedCars, setSavedCars] = useState([]);
  const [updatingCars, setUpdatingCars] = useState(new Set());
  const [relistCar, { isLoading: isRelisting }] = useRelistCarMutation();

  const toggleSave = (id) => {
    setSavedCars((prev) =>
      prev.includes(id) ? prev.filter((carId) => carId !== id) : [...prev, id]
    );
  };

  const handleMarkAsSold = async (car, isSold) => {
    if (
      window.confirm(
        `Are you sure you want to mark this car as ${
          isSold ? "sold" : "available"
        }?`
      )
    ) {
      try {
        setUpdatingCars((prev) => new Set(prev).add(car._id));
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/cars/${car._id}/sold`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isSold: !isSold }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`Car marked as ${!isSold ? "sold" : "available"}`);
          refetch();
        } else {
          toast.error(data.message || "Failed to update status");
        }
      } catch (_error) {
        console.error(_error);
        toast.error("Failed to update car status");
      } finally {
        setUpdatingCars((prev) => {
          const newSet = new Set(prev);
          newSet.delete(car._id);
          return newSet;
        });
      }
    }
  };

  if (isLoading) {
    return (
      <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
        <h1 className="md:text-4xl text-2xl font-medium mb-8">My Listings</h1>
        <p>Loading your cars...</p>
      </section>
    );
  }

  if (listingsError) {
    return (
      <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
        <h1 className="md:text-4xl text-2xl font-medium mb-8">My Listings</h1>
        <p className="text-red-500">Error loading your listings</p>
      </section>
    );
  }

  const cars = Array.isArray(data?.cars) ? data.cars : [];

  return (
    <section className="px-3 sm:px-4 md:px-6 lg:px-8 py-12 bg-[#F5F5F5]">
      <h1 className="md:text-4xl text-2xl font-medium mb-8">My Listings</h1>

      {cars.length === 0 ? (
        <p>You haven’t posted any cars yet.</p>
      ) : (
        <div className="my-5 grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-6 ">
          {cars.map((car, index) => {
            const carId = car?._id || index;
            const carImage = car?.images?.[0] || images.carPlaceholder;
            const carMake = car?.make || "Unknown Make";
            const carModel = car?.model || "Unknown Model";
            const carYear = car?.year || "N/A";
            const carPrice = car?.price?.toLocaleString() || "N/A";

            return (
              <div
                className="md:px-6 md:py-8 bg-[#D9D9D9] rounded-lg shadow-sm"
                key={carId}
              >
                <div className="w-full h-full border border-gray-100 rounded-bl-2xl rounded-br-2xl md:pb-8 pb-14">
                  <div className="h-48 relative">
                    <LazyImage
                      src={carImage}
                      alt={`${carMake} ${carModel}`}
                      className={`rounded-t-lg ${
                        car?.isSold ? "opacity-60" : ""
                      }`}
                      width="100%"
                      height="100%"
                    />
                    {car?.isSold && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                        SOLD
                      </div>
                    )}
                    <button
                      onClick={() => toggleSave(carId)}
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"
                    >
                      {savedCars.includes(carId) ? (
                        <BsBookmarkFill className="text-primary-500 text-xl" />
                      ) : (
                        <BsBookmark className="text-primary-500 text-xl" />
                      )}
                    </button>
                  </div>

                  <div className="p-5">
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
                          return features.trim()
                            ? features
                            : "No features listed";
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
                        {car?.engineCapacity
                          ? `${car.engineCapacity} CC`
                          : "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-2 md:text-xl font-medium text-lg">
                        PKR{" "}
                        <h5
                          className={`price ${
                            car?.isSold ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {carPrice}
                        </h5>
                      </div>
                      <button
                        onClick={() => car && navigate(buildCarUrl(car))}
                        className="text-primary-500 flex items-center gap-2"
                        disabled={!car?._id}
                      >
                        View Details
                        <IoIosArrowRoundUp className="text-2xl rotate-[43deg]" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/edit-car/${car._id}`)}
                          disabled={car?.isSold}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            car?.isSold
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary-500 hover:opacity-90 text-white"
                          }`}
                        >
                          {car?.isSold ? "Edit Disabled" : "Edit"}
                        </button>
                        <button
                          onClick={() => handleMarkAsSold(car, car?.isSold)}
                          disabled={updatingCars.has(car._id)}
                          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            car?.isSold
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-primary-500 hover:opacity-90 text-white"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingCars.has(car._id)
                            ? "Updating..."
                            : car?.isSold
                            ? "Mark as Available"
                            : "Mark as Sold"}
                        </button>
                      </div>

                      {/* Relist button for sold/expired listings */}
                      {(car?.status === "sold" ||
                        car?.status === "expired") && (
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "Relist this car? A new active listing will be created."
                              )
                            ) {
                              try {
                                setUpdatingCars((prev) =>
                                  new Set(prev).add(car._id)
                                );
                                await relistCar(car._id).unwrap();
                                toast.success("Car relisted successfully!");
                                refetch();
                              } catch (error) {
                                toast.error(
                                  error?.data?.message || "Failed to relist car"
                                );
                              } finally {
                                setUpdatingCars((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(car._id);
                                  return newSet;
                                });
                              }
                            }
                          }}
                          disabled={isRelisting || updatingCars.has(car?._id)}
                          className="w-full px-4 py-2 bg-primary-500 hover:opacity-90 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          {isRelisting || updatingCars.has(car?._id)
                            ? "Relisting..."
                            : "Relist"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UserListings;
