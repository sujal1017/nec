// src/config.js

/**
 * Configuration file for a Vite-based React application.
 * This file centralizes environment-specific variables using Vite's `import.meta.env`.
 */


const BaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const name = "BuySell";
export { BaseUrl, name };
