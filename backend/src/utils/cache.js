import NodeCache from "node-cache";

// Initialize cache with default TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

export const cacheKeys = {
  HOME_LAYOUT: "layout:home",
  CATEGORIES_PUBLIC: "categories:public",
  PRODUCTS_PREFIX: "products:list:",
};

/**
 * Get value from cache
 */
export const getCache = (key) => {
  return cache.get(key);
};

/**
 * Set value in cache with a TTL (in seconds)
 */
export const setCache = (key, value, ttl = 3600) => {
  return cache.set(key, value, ttl);
};

/**
 * Delete key from cache
 */
export const deleteCache = (key) => {
  return cache.del(key);
};

/**
 * Clear all cached product listings
 */
export const clearProductsCache = () => {
  const keys = cache.keys();
  const productKeys = keys.filter((key) => key.startsWith(cacheKeys.PRODUCTS_PREFIX));
  if (productKeys.length > 0) {
    cache.del(productKeys);
  }
};

/**
 * Clear categories cache and dependent product lists cache
 */
export const clearCategoriesCache = () => {
  cache.del(cacheKeys.CATEGORIES_PUBLIC);
  clearProductsCache();
};

/**
 * Clear layout cache
 */
export const clearLayoutCache = () => {
  cache.del(cacheKeys.HOME_LAYOUT);
};

/**
 * Flush all cached entries
 */
export const clearAllCache = () => {
  cache.flushAll();
};
