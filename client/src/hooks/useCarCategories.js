import { useMemo, useEffect } from "react";
import { useGetAllCategoriesQuery } from "../redux/services/adminApi";

/**
 * Custom hook to fetch and organize car categories (makes, models, years, countries, cities)
 * @param {string} vehicleType - Optional vehicle type filter (Car, Bus, Truck, Van, Bike, E-bike)
 */
export const useCarCategories = (vehicleType = null) => {
  // Build query params
  const queryParams = {
    type: "car",
    isActive: "true",
  };
  if (vehicleType) {
    queryParams.vehicleType = vehicleType;
  }

  // Use skip to prevent duplicate queries - RTK Query will cache based on query params
  const {
    data: allCarCategories,
    isLoading: carLoading,
    error: carError,
  } = useGetAllCategoriesQuery(queryParams, {
    // Refetch on mount to ensure fresh data
    refetchOnMountOrArgChange: true,
  });

  // Separate query for years - years are common for all vehicle types, so never filter by vehicleType
  const {
    data: yearCategories,
    isLoading: yearLoading,
    error: yearError,
  } = useGetAllCategoriesQuery(
    {
      type: "car",
      subType: "year",
      isActive: "true",
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    data: allLocationCategories,
    isLoading: locationLoading,
    error: locationError,
  } = useGetAllCategoriesQuery(
    {
      type: "location",
      isActive: "true",
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const carCategories = useMemo(
    () => (Array.isArray(allCarCategories) ? allCarCategories : []),
    [allCarCategories]
  );
  const yearCategoriesArray = useMemo(
    () => (Array.isArray(yearCategories) ? yearCategories : []),
    [yearCategories]
  );
  const locationCategories = useMemo(
    () => (Array.isArray(allLocationCategories) ? allLocationCategories : []),
    [allLocationCategories]
  );
  const isLoading = useMemo(
    () => carLoading || locationLoading || yearLoading,
    [carLoading, locationLoading, yearLoading]
  );

  const makes = useMemo(() => {
    return carCategories
      .filter((cat) => cat.subType === "make" && cat.isActive)
      .sort((a, b) => {
        // Sort by order field first, then alphabetically
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [carCategories]);

  const models = useMemo(() => {
    return carCategories
      .filter((cat) => cat.subType === "model" && cat.isActive)
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [carCategories]);

  const years = useMemo(() => {
    return yearCategoriesArray
      .filter((cat) => cat.subType === "year" && cat.isActive)
      .sort((a, b) => {
        // Sort years in descending order (newest first)
        const yearA = parseInt(a.name) || 0;
        const yearB = parseInt(b.name) || 0;
        return yearB - yearA;
      });
  }, [yearCategoriesArray]);

  const countries = useMemo(() => {
    return locationCategories
      .filter((cat) => cat.subType === "country" && cat.isActive)
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [locationCategories]);

  const states = useMemo(() => {
    return locationCategories.filter(
      (cat) => cat.subType === "state" && cat.isActive
    );
  }, [locationCategories]);

  const cities = useMemo(() => {
    return locationCategories.filter(
      (cat) => cat.subType === "city" && cat.isActive
    );
  }, [locationCategories]);

  const getModelsByMake = useMemo(() => {
    const map = {};
    models.forEach((model) => {
      // Skip if no parentCategory
      if (!model.parentCategory) {
        return;
      }
      const makeId =
        typeof model.parentCategory === "object" &&
        model.parentCategory !== null
          ? model.parentCategory._id
          : model.parentCategory;
      if (makeId) {
        if (!map[makeId]) {
          map[makeId] = [];
        }
        map[makeId].push(model);
      }
    });
    return map;
  }, [models]);

  const getYearsByModel = useMemo(() => {
    // Years are now independent - return empty map since years don't belong to models
    return {};
  }, [years]);

  const getStatesByCountry = useMemo(() => {
    const map = {};
    states.forEach((state) => {
      if (!state.parentCategory) return;
      const countryId =
        typeof state.parentCategory === "object" &&
        state.parentCategory !== null
          ? state.parentCategory._id
          : state.parentCategory;
      if (countryId) {
        if (!map[countryId]) {
          map[countryId] = [];
        }
        map[countryId].push(state);
      }
    });
    return map;
  }, [states]);

  const getCitiesByCountry = useMemo(() => {
    const map = {};
    cities.forEach((city) => {
      // Skip if no parentCategory
      if (!city.parentCategory) {
        return;
      }
      const countryId =
        typeof city.parentCategory === "object" && city.parentCategory !== null
          ? city.parentCategory._id
          : city.parentCategory;
      if (countryId) {
        if (!map[countryId]) {
          map[countryId] = [];
        }
        map[countryId].push(city);
      }
    });
    // Sort cities within each country
    Object.keys(map).forEach((countryId) => {
      map[countryId].sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
    });
    return map;
  }, [cities]);

  const getCitiesByState = useMemo(() => {
    const map = {};
    cities.forEach((city) => {
      if (!city.parentCategory) return;
      // Check if parent is a state (not country)
      const parentId =
        typeof city.parentCategory === "object" && city.parentCategory !== null
          ? city.parentCategory._id
          : city.parentCategory;
      // Check if parent is a state by checking if it exists in states
      const isStateParent = states.some(
        (s) =>
          (typeof s._id === "string" ? s._id : s._id?.toString()) ===
          (typeof parentId === "string" ? parentId : parentId?.toString())
      );
      if (isStateParent && parentId) {
        if (!map[parentId]) {
          map[parentId] = [];
        }
        map[parentId].push(city);
      }
    });
    // Sort cities within each state
    Object.keys(map).forEach((stateId) => {
      map[stateId].sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
    });
    return map;
  }, [cities, states]);

  return {
    makes,
    models,
    years,
    countries,
    states,
    cities,
    getModelsByMake,
    getYearsByModel,
    getStatesByCountry,
    getCitiesByCountry,
    getCitiesByState,
    isLoading,
  };
};
