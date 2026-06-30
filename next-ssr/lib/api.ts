import Cookies from "js-cookie";
import md5 from "crypto-js/md5";

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
  return { status: 200, data };
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

export async function getProductDescription(filename: string) {
  const res = await fetch(`${API_ENDPOINT}product_description/${filename}`);
  if (!res.ok) throw new Error("Failed to fetch product description");
  return res.text();
}

export async function searchsaltProducts(
  searchText: string,
  page = 1,
  { show_hidden = false, rc = null }: { show_hidden?: boolean; rc?: number | null } = {}
) {
  const res = await fetch(`${API_ENDPOINT}salt_products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: searchText,
      page,
      show_hidden,
      rc
    }),
  });
  if (!res.ok) throw new Error("Error fetching products");
  return res.json();
}

function generateRandomFileName() {
  const randomString = Math.random().toString(36).substring(2, 8);
  return `file_${randomString}`;
}

export async function uploadFile(file: File, prefix: string) {
  if (typeof window === "undefined") throw new Error("Client action only");
  const token = Cookies.get("jwt_token");
  if (!token) throw new Error("Unauthorized");

  const fileName = file.name || generateRandomFileName();
  const res = await fetch(
    `${API_ENDPOINT}generate_presigned_url?file_name=${encodeURIComponent(fileName)}&content_type=${encodeURIComponent(file.type)}&prefix=${encodeURIComponent(prefix)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to generate presigned URL");
  const { presigned_url, file_name } = await res.json();

  const uploadRes = await fetch(presigned_url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

  if (prefix === 'profilepic') {
    await updateProfileData({ profile_picture: file_name });
  }
  return file_name;
}

export async function updateProfileData(updatedData: any) {
  if (typeof window === "undefined") throw new Error("Client action only");
  const token = Cookies.get("jwt_token");
  const res = await fetch(`${API_ENDPOINT}update_profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify(updatedData),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  const data = await res.json();

  window.dispatchEvent(new Event("profileUpdated"));
  return data;
}

export async function handleGoogleLogin(token: string) {
  if (typeof window === "undefined") return { success: false };
  const res = await fetch(`${API_ENDPOINT}googleauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token }),
  });

  if (res.status === 200) {
    const data = await res.json();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    Cookies.set("jwt_token", data.token, { expires: expiryDate });
    Cookies.set("customer_name", data.customer_name || "", { expires: expiryDate });
    Cookies.set("email", data.email || "", { expires: expiryDate });
    Cookies.set("customer_id", data.customer_id, { expires: expiryDate });

    window.dispatchEvent(new Event("profileUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
    return { success: true };
  } else if (res.status === 401) {
    return { success: false, status: 401 };
  } else {
    throw new Error("Failed Google login");
  }
}

export function handleSignOut() {
  if (typeof window === "undefined") return;
  Cookies.remove('jwt_token');
  Cookies.remove('customer_name');
  Cookies.remove('email');
  Cookies.remove('customer_id');
  Cookies.remove('location');
  Cookies.remove('cart_count'); 
  localStorage.removeItem("token");
  localStorage.removeItem("cartState"); 
  localStorage.clear();
  sessionStorage.clear();
  
  window.dispatchEvent(new Event('clearCart'));
}

export async function sendOTP(phoneNumber: string) {
  const res = await fetch(`${API_ENDPOINT}send_otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
}

export async function getOrders(page = 1, search = "", per_page = 10) {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("jwt_token");
  const res = await fetch(`${API_ENDPOINT}orders?page=${page}&search=${encodeURIComponent(search)}&per_page=${per_page}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    }
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getRewardsSummary() {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("jwt_token");
  const res = await fetch(`${API_ENDPOINT}rewards-summary`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    }
  });
  if (!res.ok) throw new Error("Failed to fetch rewards summary");
  return res.json();
}

export async function getSalt(salt_name = "") {
  const res = await fetch(`${API_ENDPOINT}get_salt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ salt_name }),
  });
  if (!res.ok) throw new Error("Failed to fetch salt");
  return res.json();
}

export async function checkCustomer(phone_number: string) {
  const res = await fetch(`${API_ENDPOINT}check_customer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number }),
  });
  if (!res.ok) throw new Error("Failed check customer");
  return res.json();
}


export async function handleSignIn(phone_number: string, otp: string[]) {
  const res = await fetch(`${API_ENDPOINT}login_otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number, otp: otp.join("") }),
  });
  if (!res.ok) throw new Error("Invalid OTP");
  return res.json();
}

export async function handleSignInwithOtp(phone_number: string, otp: string[]) {
  const res = await fetch(`${API_ENDPOINT}login_otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number, otp: otp.join("") }),
  });
  if (!res.ok) throw new Error("Invalid OTP");
  const data = await res.json();
  
  if (typeof window !== "undefined") {
    handleSignOut();
    Cookies.set("jwt_token", data.token, { expires: 7 });
    Cookies.set("customer_id", data.customer_id, { expires: 7 });
    Cookies.set("customer_name", data.customer_name || "", { expires: 7 });
    Cookies.set("email", data.email || "", { expires: 7 });
    Cookies.set("location", data.location || "", { expires: 7 });

    window.dispatchEvent(new Event("profileUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
  }
  return data;
}

export async function handleLoginsendOTP(phone_number: string) {
  const res = await fetch(`${API_ENDPOINT}send_otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number }),
  });
  if (!res.ok) throw new Error("Failed to send OTP");
  return res.json();
}

export async function handleSignInPassword(phone_number: string, password_raw: string) {
  const password = md5(password_raw).toString();
  const res = await fetch(`${API_ENDPOINT}login_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number, password }),
  });
  if (!res.ok) throw new Error("Invalid password");
  const data = await res.json();
  
  if (typeof window !== "undefined") {
    Cookies.set("jwt_token", data.token, { expires: 30 });
    Cookies.set("customer_id", data.customer_id, { expires: 30 });
    Cookies.set("customer_name", data.customer_name || "", { expires: 30 });
    Cookies.set("email", data.email || "", { expires: 30 });
    Cookies.set("location", data.location || "", { expires: 30 });

    window.dispatchEvent(new Event("profileUpdated"));
    window.dispatchEvent(new Event("cartUpdated"));
  }
  return data;
}

export async function createPassword(phone_number: string, password_raw: string, otp: string, jwt_token: string, customer_id: string) {
  const password = md5(password_raw).toString();
  const res = await fetch(`${API_ENDPOINT}create_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number, password, otp }),
  });
  if (!res.ok) throw new Error("Failed to create password");
  const data = await res.json();
  
  if (typeof window !== "undefined") {
    Cookies.set("jwt_token", jwt_token, { expires: 30 });
    Cookies.set("customer_id", customer_id, { expires: 30 });
  }
  return data;
}

export async function handleGoogleSignup(phone_number: string, token: string, otp: string, jwt_token: string, customer_id: string) {
  const res = await fetch(`${API_ENDPOINT}googleauthsignup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number, token, otp }),
  });
  if (!res.ok) throw new Error("Failed Google signup");
  const data = await res.json();
  
  if (typeof window !== "undefined") {
    Cookies.set("jwt_token", jwt_token, { expires: 30 });
    Cookies.set("customer_id", customer_id, { expires: 30 });
  }
  return data;
}

export async function getCartDataForID(cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}cart?cart_id=${cart_id}`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error("Failed to get cart data for ID");
  const data = await res.json();
  return { status: 200, data };
}

export async function updateCODCharge(cart_id: string | number, cod_charge: number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_cod_charge`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id, cod_charge })
  });
  if (!res.ok) throw new Error("Failed to update COD charge");
  return res.json();
}

export async function updateDeliveryAddress(addressId: string | number, cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_delivery_address`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ address_id: addressId, cart_id })
  });
  if (!res.ok) throw new Error("Failed to update delivery address");
  return res.json();
}

export async function updateChoosePrescription(prescription_id: string | number, cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_choose_prescription`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prescription_id, cart_id })
  });
  if (!res.ok) throw new Error("Failed to update prescription");
  return res.json();
}

export async function updatePrescription(imageUrl: string, prescriptionName: string, prescriptionDate: string) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_prescription`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prescription_image_url: imageUrl,
      prescription_date: prescriptionDate,
      prescription_status: 'RECEIVED',
      prescription_comments: '',
      prescription_name: prescriptionName
    })
  });
  if (!res.ok) throw new Error("Failed to update prescription");
  return res.json();
}

export async function placePrescription(prescription_id: string | number, cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}place_prescription`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prescription_id, cart_id })
  });
  if (!res.ok) throw new Error("Failed to place prescription order");
  return res.json();
}


export async function updateAddress(addressId: string | number, newAddress: any) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_address`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: addressId, address: newAddress })
  });
  if (!res.ok) throw new Error("Failed to update address");
  return res.json();
}

export async function addAddress(newAddress: any) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}add_address`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ address: newAddress })
  });
  if (!res.ok) throw new Error("Failed to add address");
  return res.json();
}

export async function listPrescriptions() {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}list_prescriptions`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.prescriptions || [];
}

export async function listAddresses() {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}list_addresses`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.addresses || [];
}

export async function applyCouponAPI(couponCode: string, cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}apply_coupon`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ coupon_code: couponCode, cart_id })
  });
  if (!res.ok) throw new Error("Failed to apply coupon");
  return res.json();
}

export async function getCartCount() {
  const token = Cookies.get('jwt_token');
  if (!token) return { cart_count: 0 };
  const res = await fetch(`${API_ENDPOINT}cart_count`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return { cart_count: 0 };
  return res.json();
}

export async function removePrescriptionFromCart(cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}remove_prescription_from_cart`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id })
  });
  if (!res.ok) throw new Error("Failed to remove prescription from cart");
  return res.json();
}

export async function updateDeliveryCharge(cart_id: string | number, shipping_charge: number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}update_delivery_charge`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id, shipping_charge })
  });
  if (!res.ok) throw new Error("Failed to update delivery charge");
  return res.json();
}

export async function assignOfferToCart(cart_id: string | number, offer_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}cart/${cart_id}/assign-offer`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ offer_id })
  });
  if (!res.ok) throw new Error("Failed to assign offer to cart");
  return res.json();
}

export async function placeOrder(cart_id: string | number, total_cart_value: number, delivery_type: string) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}place_order`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id, total_cart_value, delivery_type })
  });
  if (!res.ok) throw new Error("Failed to place order");
  return res.json();
}

export async function selectAddress(addressId: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}select_address`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: addressId })
  });
  if (!res.ok) throw new Error("Failed to select address");
  return res.json();
}

export async function deleteAddress(addressId: string | number, customerId: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}delete_address`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: addressId, customer_id: customerId })
  });
  if (!res.ok) throw new Error("Failed to delete address");
  return res.json();
}

export async function reActivateCart(cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}re_active_cart`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id })
  });
  if (!res.ok) throw new Error("Failed to reactivate cart");
  return res.json();
}

export async function checkDTDCAvailability(pincode: string) {
  const token = Cookies.get("jwt_token");
  const res = await fetch(`${API_ENDPOINT}dtdc/check?pincode=${encodeURIComponent(pincode)}`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    }
  });
  if (!res.ok) throw new Error("Failed to check DTDC availability");
  return res.json();
}

export async function check_payment(cart_id: string | number, razorpay_order_id: string, razorpay_payment_id: string) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}check_payment`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id, razorpay_order_id, razorpay_payment_id })
  });
  if (!res.ok) throw new Error("Failed to check payment");
  const data = await res.json();
  return { status: 200, data };
}

export async function create_order(cart_id: string | number, total_amount: number | string, coupon_savings: number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}create_order`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id, total_amount, coupon_savings })
  });
  if (!res.ok) throw new Error("Failed to create order");
  const data = await res.json();
  return { status: 200, data };
}

export async function cancelOrder(cart_id: string | number) {
  const token = Cookies.get('jwt_token');
  const res = await fetch(`${API_ENDPOINT}cancel_order`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cart_id })
  });
  if (!res.ok) throw new Error("Failed to cancel order");
  return res.json();
}

export async function updateCartPayment(cart_id: string | number, payment_mode: string, cart_status?: string | null) {
  const token = Cookies.get('jwt_token');
  const bodyPayload: any = { cart_id, payment_mode };
  if (cart_status) bodyPayload.cart_status = cart_status;

  const res = await fetch(`${API_ENDPOINT}cart/payment-update`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyPayload)
  });
  if (!res.ok) throw new Error("Failed to update cart payment");
  return res.json();
}















