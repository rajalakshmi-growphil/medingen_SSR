import Cookies from "js-cookie";

export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || 'https://medingen.in/api/';

// Helper for client-side authorization header
const getAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = Cookies.get("jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUser = () => {
  if (typeof window === "undefined") {
    return {
      customer_id: undefined,
      name: undefined,
      email: undefined,
      location: undefined,
      selectedAddress: undefined,
      isLoggedIn: false
    };
  }
  return {
    customer_id: Cookies.get('customer_id'),
    name: Cookies.get('customer_name'),
    email: Cookies.get('email'),
    location: Cookies.get('location'),
    selectedAddress: Cookies.get('selectedAddress'),
    isLoggedIn: Cookies.get('customer_id') ? true : false
  };
};

export async function getFooterProducts() {
  const res = await fetch(`${API_ENDPOINT}footer-products`, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error('Failed to fetch footer products');
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_ENDPOINT}home_categories`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch home categories');
  return res.json();
}

export async function getAllCategories() {
  const res = await fetch(`${API_ENDPOINT}all_categories`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch all categories');
  return res.json();
}

export async function getMainCategories() {
  const res = await fetch(`${API_ENDPOINT}main_categories`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch main categories');
  return res.json();
}

export async function getBanner(section: string) {
  const res = await fetch(`${API_ENDPOINT}banner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ section }),
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Failed to fetch banner for ${section}`);
  return res.json();
}

export async function searchProducts(
  searchText: string,
  page = 1,
  { category_name = "", show_hidden = false, query = "" }: { category_name?: string; show_hidden?: boolean; query?: string } = {}
) {
  const res = await fetch(`${API_ENDPOINT}products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: searchText,
      page,
      category_name,
      show_hidden,
      query
    }),
  });
  if (!res.ok) throw new Error('Failed to search products');
  return res.json();
}

export async function searchSalt(searchTerm: string) {
  const res = await fetch(`${API_ENDPOINT}search_composition_code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ search_term: searchTerm }),
  });
  if (!res.ok) throw new Error("Error fetching salts");
  return res.json();
}

export async function searchVector(searchTerm: string) {
  const res = await fetch(`${API_ENDPOINT}search?q=${encodeURIComponent(searchTerm)}`);
  if (!res.ok) throw new Error("Error fetching vector search results");
  return res.json();
}

// Client-side API requests
export async function getCartData() {
  const headers = getAuthHeader();
  const res = await fetch(`${API_ENDPOINT}cart`, { headers });
  if (!res.ok) throw new Error("Failed to fetch cart data");
  const data = await res.json();
  return { data };
}

export async function getProfileData() {
  const headers = getAuthHeader();
  const res = await fetch(`${API_ENDPOINT}get_profile`, { headers });
  if (!res.ok) throw new Error("Failed to fetch profile data");
  return res.json();
}

export async function addToCart(productId: string | null, prescriptionId: number | null = 0, quantity = 1) {
  if (typeof window === "undefined") throw new Error("Client action only");
  const token = Cookies.get("jwt_token");
  if (!token) throw new Error("Unauthorized");

  const payload: any = { prescription_id: prescriptionId };
  if (productId) {
    payload.product_id = productId;
    payload.quantity = quantity;
  }

  const res = await fetch(`${API_ENDPOINT}add-to-cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Error adding to cart");
  const data = await res.json();
  
  // Dispatch event on client
  window.dispatchEvent(new Event('cartUpdated'));
  return data;
}

export async function getDefaultAddress() {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("jwt_token");
  if (!token) return null;

  const res = await fetch(`${API_ENDPOINT}get_default_address`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getAllBlogs(popular = false, categoryId: string | null = null) {
  const url = categoryId 
    ? `${API_ENDPOINT}all_blogs?popular=${popular}&category_id=${categoryId}`
    : `${API_ENDPOINT}all_blogs?popular=${popular}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Error fetching blogs");
  return res.json();
}

export async function getTestimonials() {
  const res = await fetch("https://featurable.com/api/v1/widgets/fb210dba-0301-4000-982d-6e8006ca39f3", { next: { revalidate: 86400 } }); // Cache for 24 hours
  if (!res.ok) return null;
  return res.json();
}

export async function updateCartData(updatedData: any, cartId: string | null) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}cart_update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ quantities: updatedData, cart_id: cartId }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("STALE_CART");
    throw new Error("Failed to update cart");
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event('cartUpdated'));
  }
  return res.json();
}

export async function requestProduct(productId: string | number, customerId: string | number, prescriptionId: any, mode = "Insert", status = "PENDING") {
  const token = Cookies.get("jwt_token");
  const res = await fetch(`${API_ENDPOINT}request-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({
      product_id: productId,
      customer_id: customerId,
      prescription_id: prescriptionId,
      status: status,
      mode
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getProductsByCategory({
  categoryId = null,
  categoryName = null,
  page = 1,
  perPage = 12,
  sortBy = "price_low_high",
  consumeType = null,
  composition = null,
  subCategories = []
}: {
  categoryId?: string | number | null;
  categoryName?: string | null;
  page?: number;
  perPage?: number;
  sortBy?: string;
  consumeType?: string | null;
  composition?: string | null;
  subCategories?: string[];
}) {
  const res = await fetch(`${API_ENDPOINT}get_products_by_category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category_name: categoryName,
      page,
      per_page: perPage,
      sort_by: sortBy,
      consume_type: consumeType,
      composition,
      sub_categories: subCategories
    }),
  });
  if (!res.ok) throw new Error('Failed to fetch products by category');
  return res.json();
}

export async function getProductDetails(id: number | string = 0, name = "") {
  const res = await fetch(`${API_ENDPOINT}product_details/${id}?name=${name}`);
  if (!res.ok) throw new Error("Failed to fetch product details");
  return res.json();
}

export async function getCouponDetails(code: string) {
  const res = await fetch(`${API_ENDPOINT}coupon_details/${code}`);
  if (!res.ok) throw new Error("Failed to fetch coupon details");
  return res.json();
}

export async function getAveragePrice(composition = "", salt_name = "") {
  const res = await fetch(`${API_ENDPOINT}avg_price`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ composition, salt_name }),
  });
  if (!res.ok) throw new Error("Failed to fetch average price");
  return res.json();
}

export async function search_altProducts(
  page = 1,
  {
    composition = "",
    exclude_product_id = null,
    rc = 1,
    show_hidden = false,
  }: {
    composition?: string;
    exclude_product_id?: string | number | null;
    rc?: number;
    show_hidden?: boolean;
  } = {}
) {
  const res = await fetch(`${API_ENDPOINT}alt_products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page,
      composition,
      exclude_product_id,
      rc,
      show_hidden,
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch alternate products");
  return res.json();
}

export async function getOffers(page = 1) {
  const res = await fetch(`${API_ENDPOINT}offers?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch offers");
  return res.json();
}


