/**
 * Format price with commas and currency symbol
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return "N/A";

  // Convert to number if it's a string
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  // Check if the conversion was successful
  if (isNaN(numPrice)) return "N/A";

  // Format the number with commas
  const formattedNumber = numPrice.toLocaleString();

  // Return with currency symbol
  return `${formattedNumber}`;
};

/**
 * Format mileage with commas
 * @param {number} mileage - The mileage to format
 * @returns {string} Formatted mileage string
 */
export const formatMileage = (mileage) => {
  if (mileage === null || mileage === undefined) return "N/A";
  return mileage.toLocaleString("en-US") + " km";
};

/**
 * Format date to a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default {
  formatPrice,
  formatMileage,
  formatDate,
};
