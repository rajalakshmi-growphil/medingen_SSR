export { ApiError, BASE_URL } from "./client";

export {
  getProductsByCategory,
  getProductDetails,
  getFooterProducts,
  fetchHtmlDescription,
  getBanner,
  getPopularProducts,
} from "./products";
export type { GetProductsByCategoryParams } from "./products";

export {
  getCategories,
  getAllCategories,
  getMainCategories,
  getCategoryHierarchy,
} from "./categories";

export {
  getSalt,
  getAveragePrice,
  getPopularSalts,
} from "./salts";

export {
  searchProducts,
  searchSaltProducts,
  searchSalt,
  searchAltProducts,
} from "./search";
export type { SearchAltProductsParams } from "./search";

export {
  getCouponDetails,
} from "./cart";
