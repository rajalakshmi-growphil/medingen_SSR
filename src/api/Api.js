import md5 from 'crypto-js/md5';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2'

export const API_ENDPOINT = 'https://medingen.in/api/';
// export const API_ENDPOINT = 'http://localhost:8001/api/';
// export const API_ENDPOINT = 'https://pl03w30q-8001.inc1.devtunnels.ms/api/';
// export const API_ENDPOINT = 'https://kvs7ldzc-8001.inc1.devtunnels.ms/api/';
// export const API_ENDPOINT = 'https://ybtl1v52xd.execute-api.ap-south-1.amazonaws.com/dev/api/';



const handleSignOut = () => {
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
  
  // Dispatch event to clear cart in UI state
  window.dispatchEvent(new Event('clearCart'));
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const message = error.response.data?.message || error.response.data?.error || "";
      if (message === "Token is invalid" || message === "Invalid token") {
        handleSignOut();
        // Redirect removed as requested
      }
    }
    return Promise.reject(error);
  }
);

export const sendNotification = async (heading, body) => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(heading, {
      body: body,
      icon: '/android-chrome-192x192.png',
    });
  } else {
    console.error('Service worker not supported in this browser.');
  }
};

export const checkDTDCAvailability = async (pincode) => {
  const token = Cookies.get("jwt_token");

  const res = await axios.get(
    `${API_ENDPOINT}dtdc/check`,
    {
      params: { pincode },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

export const subscribeNotification = async (subscription) => {

  try {
    const token = Cookies.get('jwt_token');
    const response = await axios.post(`${API_ENDPOINT}save-subscription`, { subscription }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    console.error('Error subscribing user for notifications:', error);
    console.error(error);
    throw error;
  }
};

const checkLogin = () => {
  if (Cookies.get('jwt_token')) {
    return Cookies.get('jwt_token');
  }
  return false;
}

const getUser = () => {
  return {
    customer_id: Cookies.get('customer_id'),
    name: Cookies.get('customer_name'),
    email: Cookies.get('email'),
    location: Cookies.get('location'),
    selectedAddress: Cookies.get('selectedAddress'),
    isLoggedIn: Cookies.get('customer_id') ? true : false
  }
}

const handleSignIn = async (phone_number, otp, navigate) => {
  try {
    Swal.showLoading();
    const response = await axios.post(API_ENDPOINT + "login_otp", { "phone_number": phone_number, "otp": otp.join("") });

    if (response.status === 200) {
      const token = response.data.token;
      handleSignOut();
      Swal.close();
      navigate('/createpassword', { replace: true, state: { phoneNumber: phone_number, otp: otp.join(""), jwt_token: token, customer_id: response.data.customer_id } });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid username or password. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid OTP. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Error accessing the backend',
        icon: 'error',
        confirmButtonText: 'Try again later',
      });
    }
  }
};

const handleSignInwithOtp = async (phone_number, otp, navigate) => {
  try {
    Swal.showLoading();
    const response = await axios.post(API_ENDPOINT + "login_otp", {
      phone_number: phone_number,
      otp: otp.join("")
    });

    if (response.status === 200) {
      const { token, customer_id, customer_name, email, location } = response.data;

      // Clear existing tokens if any
      handleSignOut();

      // ✅ Set cookies
      Cookies.set("jwt_token", token, { expires: 7 });
      Cookies.set("customer_id", customer_id, { expires: 7 });
      Cookies.set("customer_name", customer_name || "", { expires: 7 });
      Cookies.set("email", email || "", { expires: 7 });
      Cookies.set("location", location || "", { expires: 7 });

      // Dispatch events to refresh global state
      window.dispatchEvent(new Event("profileUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      Swal.close();
      navigate("/", {
        replace: true,
        state: {
          phoneNumber: phone_number,
          otp: otp.join(""),
          jwt_token: token,
          customer_id: customer_id
        }
      });
    } else {
      Swal.fire({
        title: "Error!",
        text: "Invalid username or password. Please try again.",
        icon: "error",
        confirmButtonText: "Try again"
      });
    }
  } catch (error) {
    Swal.close();
    if (error.response && error.response.status === 401) {
      Swal.fire({
        title: "Error!",
        text: "Invalid OTP. Please try again.",
        icon: "error",
        confirmButtonText: "Try again"
      });
    } else {
      Swal.fire({
        title: "Error!",
        text: "Error accessing the backend",
        icon: "error",
        confirmButtonText: "Try again later"
      });
    }
  }
};

export const handleSignInPassword = async (phone_number, password, navigate) => {
  try {
    password = md5(password).toString();

    const response = await axios.post(API_ENDPOINT + "login_password", { "phone_number": phone_number, "password": password });

    if (response.status === 200) {
      const token = response.data.token;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Set expiry to 1 month from now

      Cookies.set('jwt_token', token, { expires: expiryDate });
      Cookies.set('customer_name', response.data.customer_name, { expires: expiryDate });
      Cookies.set('email', response.data.email, { expires: expiryDate });
      Cookies.set('customer_id', response.data.customer_id, { expires: expiryDate });

      // Dispatch events to refresh global state
      window.dispatchEvent(new Event("profileUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      navigate('/', { replace: true });

    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid username or password. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid password. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Error accessing the backend',
        icon: 'error',
        confirmButtonText: 'Try again later',
      });
    }
  }
};

export const handleGoogleSignup = async (phone_number, token, otp, navigate, customer_id, jwt_token) => {
  try {
    Swal.showLoading();
    const response = await axios.post(API_ENDPOINT + "googleauthsignup", { "phone_number": phone_number, "token": token, "otp": otp });
    if (response.status === 200) {
      Cookies.set('jwt_token', jwt_token);
      Cookies.set('customer_id', customer_id);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Login created successfully!',
      }).then(() => {
        if (response.data.customer_name === null) {
          navigate("/create-profile", { replace: true });
        } else {
          Cookies.set("customer_name", response.data.customer_name);
          // Dispatch events to refresh global state
          window.dispatchEvent(new Event("profileUpdated"));
          window.dispatchEvent(new Event("cartUpdated"));
          navigate("/profile", { replace: true });
        }
      });


    } else {

      Swal.fire({
        title: 'Error!',
        text: 'Failed to setup login',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Something went wrong!',
      text: 'Failed to setup login',
      icon: 'error',
      confirmButtonText: 'Try again',
    });
  }

}


export const handleGoogleLogin = async (token, navigate) => {
  try {
    const response = await axios.post(API_ENDPOINT + "googleauth", {
      token: token,
    }, {
      validateStatus: (status) => status < 500, // Allows handling 4xx responses manually
    });

    if (response.status === 200) {
      const token = response.data.token;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Set expiry to 1 month from now

      Cookies.set("jwt_token", token, { expires: expiryDate });
      Cookies.set("customer_name", response.data.customer_name, {
        expires: expiryDate,
      });
      Cookies.set("email", response.data.email, { expires: expiryDate });
      Cookies.set("customer_id", response.data.customer_id, {
        expires: expiryDate,
      });

      // Dispatch events to refresh global state
      window.dispatchEvent(new Event("profileUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      navigate("/", { replace: true });
    }
    if (response.status === 401) {
      Swal.fire({
        title: "Not found!",
        text: "User not found or google sign in not connected. Please sign up or connect the google account in the profile section.",
        icon: "info",
        confirmButtonText: "OK",
      });
    }
  } catch (error) {
    Swal.fire({
      title: "Error!",
      text: "Something went wrong. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });

  }

};

export const getAveragePrice = async (composition = "", salt_name = "") => {
  try {
    const response = await axios.post(`${API_ENDPOINT}avg_price`, {
      composition: composition,
      salt_name: salt_name
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderTracking = async (trackingId) => {
  const token = Cookies.get("jwt_token");
  const res = await axios.post(`${API_ENDPOINT}order-tracking/${trackingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getSalt = async (salt_name = "") => {
  try {
    const response = await axios.post(`${API_ENDPOINT}get_salt`, {
      salt_name: salt_name
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrders = async (page = 1, search = "", per_page = 10) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.get(`${API_ENDPOINT}orders?page=${page}&search=${search}&per_page=${per_page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};


export const updateProfileData = async (updatedData) => {
  try {
    const token = Cookies.get('jwt_token');
    const response = await axios.post(`${API_ENDPOINT}update_profile`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      Swal.fire('Success', 'Profile updated successfully', 'success');
      // Dispatch event to refresh global state
      window.dispatchEvent(new Event("profileUpdated"));
      return response.data;
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    Swal.fire('Error', 'Failed to update profile data', 'error');
    console.error(error);
    throw error;
  }
};

export const updatePassword = async (newPasswordHash) => {
  const token = Cookies.get('jwt_token');
  const response = await axios.post(`${API_ENDPOINT}update_profile`, { password: newPasswordHash }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response;
};



export const getAllReminders = async () => {
  try {
    const token = Cookies.get('jwt_token');
    const response = await axios.get(`${API_ENDPOINT}all_reminders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to fetch reminders');
    }
  } catch (error) {
    Swal.fire('Error', 'Failed to fetch reminders', 'error');
    console.error(error);
    throw error;
  }
};


export const deleteReminder = async (reminderId) => {
  const token = Cookies.get('jwt_token');
  try {
    await axios.post(
      `${API_ENDPOINT}delete_reminder`,
      { reminder_id: reminderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    Swal.fire("Success", "Reminder deleted successfully", "success");
    return true;
  } catch (error) {
    Swal.fire("Error", "Failed to delete reminder", "error");
  }
};

export const addReminder = async (reminderData) => {
  try {
    const token = Cookies.get('jwt_token');
    const response = await axios.post(`${API_ENDPOINT}add_reminder`, reminderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to add reminder');
    }
  } catch (error) {
    Swal.fire('Error', 'Failed to add reminder', 'error');
    console.error(error);
  }
};

export const markReminderAsDone = async (reminderId) => {
  try {
    const token = Cookies.get('jwt_token');
    const response = await axios.post(`${API_ENDPOINT}mark_as_taken`, { reminder_id: reminderId }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to mark reminder as done');
    }
  } catch (error) {
    Swal.fire('Error', 'Failed to mark reminder as done', 'error');
    console.error(error);
  }
};

export const sendOTP = async (phoneNumber, navigate) => {
  try {
    Swal.showLoading();
    const response = await axios.post(`${API_ENDPOINT}send_otp`, { "phone_number": phoneNumber });

    if (response.status === 200) {
      Swal.close();
      navigate("/login2", { state: { phoneNumber } });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'User does not exist. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      Swal.fire({
        title: 'Error!',
        text: 'User does not exist. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong. Please try again later.',
        icon: 'error',
        confirmButtonText: 'Try again later',
      });
    }
  }
};

export const handleLoginsendOTP = async (phoneNumber, navigate) => {
  try {
    Swal.showLoading();
    const response = await axios.post(`${API_ENDPOINT}send_otp`, { "phone_number": phoneNumber });

    if (response.status === 200) {
      Swal.close();
      navigate("/Login3", { state: { phoneNumber } });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'User does not exist. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      Swal.fire({
        title: 'Error!',
        text: 'User does not exist. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong. Please try again later.',
        icon: 'error',
        confirmButtonText: 'Try again later',
      });
    }
  }
};



export const createPassword = async (phone_number, password, otp, navigate, customer_id, jwt_token) => {
  try {
    Swal.showLoading();
    password = md5(password
    ).toString();
    const response = await axios.post(API_ENDPOINT + "create_password", { "phone_number": phone_number, "password": password, "otp": otp });
    if (response.status === 200) {
      Cookies.set('jwt_token', jwt_token);
      Cookies.set('customer_id', customer_id);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Password created successfully!',
      }).then(() => {
        if (response.data.customer_name === null) {
          navigate("/create-profile", { replace: true });
        } else {
          Cookies.set("customer_name", response.data.customer_name);
          // Dispatch events to refresh global state
          window.dispatchEvent(new Event("profileUpdated"));
          window.dispatchEvent(new Event("cartUpdated"));
          navigate("/profile", { replace: true });
        }
      });


    } else {

      Swal.fire({
        title: 'Error!',
        text: 'Failed to create password',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Something went wrong!',
      text: 'Failed to create password',
      icon: 'error',
      confirmButtonText: 'Try again',
    });
  }
};

export const checkReminderAtGivenTime = async (givenTime) => {
  const token = Cookies.get('jwt_token');

  try {
    const response = await axios.post(
      `${API_ENDPOINT}check_reminder`,
      { given_time: givenTime },
      {
        headers: {
          Authorization: `Bearer ${token}`,  // Add Authorization header with JWT token
        },
      }
    );
    return response.data;  // Return the data for use in the component
  } catch (error) {
    console.error("Error checking reminder:", error);
    throw error;  // Propagate the error for handling in the component
  }
};

export const markAsTaken = async (reminderId) => {
  const token = Cookies.get('jwt_token');

  try {
    const response = await axios.post(
      `${API_ENDPOINT}mark_as_taken`,
      { reminder_id: reminderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking reminder as taken:", error);
    throw error;
  }
};


export const createProfile = async (profileData, navigate) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(API_ENDPOINT + "update_profile", profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      Cookies.set('customer_name', profileData.customer_name);
      Cookies.set('email', profileData.email);

      // Dispatch events to refresh global state
      window.dispatchEvent(new Event("profileUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));

      navigate("/profile", { replace: true });
    } else {
      throw new Error("Failed to create profile");
    }
  } catch (error) {
    throw new Error("Failed to create profile: " + error.message);
  }
};

export const checkCustomer = async (phone_number, navigate) => {
  try {
    Swal.showLoading();
    const response = await axios.post(API_ENDPOINT + "check_customer", { "phone_number": phone_number });
    Swal.close();
    if (response.status === 200) {
      if (response.data.exists) {
        navigate("/existing", { state: { phoneNumber: phone_number } });
      } else {
        sendOTP(phone_number, navigate);
      }
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong.',
        icon: 'error',
        confirmButtonText: 'Try again',
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Something went wrong.',
      icon: 'error',
      confirmButtonText: 'Try again',
    });
  }
};


export const getAllCategories = async () => {
  const response = await axios.get(API_ENDPOINT + "all_categories", {

  });
  return response.data;
}


export const getMainCategories = async () => {
  const response = await axios.get(API_ENDPOINT + "main_categories");
  return response.data;
}

export const getCategoryHierarchy = async () => {
  const response = await axios.get(API_ENDPOINT + "category_hierarchy");
  return response.data;
}


const getCategories = async () => {
  const response = await axios.get(API_ENDPOINT + "home_categories", {

  });
  return response.data;
}

export const getRewardsTransactions = async (page = 1) => {
  const token = Cookies.get('jwt_token');

  try {
    const response = await axios.get(`${API_ENDPOINT}rewards?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    throw error;
  }
};

export const getRewardsSummary = async () => {
  const token = Cookies.get('jwt_token');

  try {
    const response = await axios.get(`${API_ENDPOINT}rewards-summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rewards summary:', error);
    throw error;
  }
};


export const getOffers = async (page = 1) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}offers?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};


export const getNotifications = async (page = 1) => {
  console.log("Fetching notifications, page:", page);
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.get(`${API_ENDPOINT}notifications?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Notifications fetched successfully:", response.data.notifications.length);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  const token = Cookies.get('jwt_token');
  try {
    await axios.put(`${API_ENDPOINT}notifications/${notificationId}/mark-as-read`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};


export const getFooterProducts = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}footer-products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching footer products:', error);
    throw error;
  }
};


const getProductList = async (page = 1, query = '', text = '') => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(
      API_ENDPOINT + 'products',
      {
        page: page,
        query: query,
        text: text
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching product list:', error);
    throw error;
  }
};



export const getCartData = async () => {
  const token = Cookies.get('jwt_token');
  const response = await axios.get(`${API_ENDPOINT}cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};


export const getCartDataForID = async (cart_id) => {
  const token = Cookies.get('jwt_token');
  const response = await axios.get(`${API_ENDPOINT}cart?cart_id=${cart_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

export const updateCODCharge = async (cart_id, cod_charge) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}update_cod_charge`, { cart_id: cart_id, cod_charge: cod_charge }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating COD charge:', error);
    throw error;
  }
};

export const updateDeliveryAddress = async (addressId, cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}update_delivery_address`, { address_id: addressId, cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update delivery address ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    console.error('Error updating delivery address:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Failed to update delivery address',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
};

export const updateChoosePrescription = async (prescription_id, cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}update_choose_prescription`, { prescription_id: prescription_id, cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update prescription ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    console.error('Error updating prescription:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Failed to update prescription',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
};

export const check_payment = async (cart_id, razorpay_order_id, razorpay_payment_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}check_payment`, { cart_id: cart_id, razorpay_order_id: razorpay_order_id, razorpay_payment_id: razorpay_payment_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response;
  } catch (error) {
    console.error('Error checking payment:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Failed to check payment',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
};

export const create_order = async (cart_id, total_amount, coupon_savings) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}create_order`, { cart_id: cart_id, total_amount: total_amount, coupon_savings: coupon_savings }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Failed to create order',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
};


export const mig_payment = async (cart_id, total_amount, coupon_code_used) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}complete_mig_payment`, { cart_id: cart_id, total_amount: total_amount, coupon_code_used: coupon_code_used }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response;
  } catch (error) {
    console.error('Error paying for the order using MIG Coins:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Error paying for the order using MIG Coins',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
};


export const placeOrder = async (cart_id, total_cart_value, delivery_type) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}place_order`, { cart_id: cart_id, total_cart_value: total_cart_value, delivery_type: delivery_type }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      return response.data;
    }
    else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to place order ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Failed to place order, backend error ',
      icon: 'error',
      confirmButtonText: 'Okay',
    });

  }
};



export const cancelOrder = async (cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}cancel_order`, { cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    throw error
  }
};


export const updateCartData = async (updatedData, cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}cart_update`, { quantities: updatedData, cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      window.dispatchEvent(new Event('cartUpdated'));
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update cart ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });

    }
  } catch (error) {
    if (error.response?.status === 404 || error.response?.data?.message?.includes("not found")) {
      window.dispatchEvent(new Event('clearCart'));
      throw new Error("STALE_CART");
    }
    Swal.fire({
      title: 'Error!',
      text: error.response?.data?.message || 'Failed to update cart, backend error',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
    throw error;
  }
};

export const reActivateCart = async (cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}re_active_cart`, { cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error reactivating cart:', error);
    throw error;
  }
};


export const getProfileData = async () => {
  const token = Cookies.get('jwt_token');
  const response = await axios.get(API_ENDPOINT + "get_profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};


function generateRandomFileName() {
  const randomString = Math.random().toString(36).substring(2, 8);
  return `file_${randomString}`;
}

export async function updatePrescription(imageUrl, prescriptionName, prescriptionDate) {
  try {
    const token = Cookies.get('jwt_token');

    const response = await axios.post(`${API_ENDPOINT}update_prescription`, {
      prescription_image_url: imageUrl,
      prescription_date: prescriptionDate,
      prescription_status: 'RECEIVED',
      prescription_comments: '',
      prescription_name: prescriptionName
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      console.log('Prescription updated successfully');
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update prescription ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    console.error('Error updating prescription:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Error updating prescription. Try again later',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
}

export async function placePrescription(prescription_id, cart_id) {
  try {
    const token = Cookies.get('jwt_token');

    const response = await axios.post(`${API_ENDPOINT}place_prescription`, {
      prescription_id: prescription_id,
      cart_id: cart_id
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      console.log('Prescription order placed successfully');
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to place order on prescription ' + response.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    console.error('Error updating prescription:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Error placing prescription order. Try again later',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
}



export async function uploadFile(file, prefix) {
  try {
    const token = Cookies.get('jwt_token');

    const response = await axios.get(API_ENDPOINT + 'generate_presigned_url', {
      headers: {
        Authorization: `Bearer ${token}`,
      },

      params: {
        file_name: file.name || generateRandomFileName(),
        content_type: file.type,
        prefix: prefix
      }
    });

    const { presigned_url, file_name } = response.data;

    // Use the pre-signed URL to upload the file to S3
    const uploadResponse = await axios.put(presigned_url, file, {
      headers: {
        'Content-Type': file.type,
      }
    });

    if (uploadResponse.status === 200) {
      console.log('File uploaded successfully with name:', file_name);
      if (prefix === 'profilepic') {
        updateProfileData({ profile_picture: file_name });
      }
      return file_name;

    } else {
      Swal.fire({
        title: 'Error!',
        text: 'File upload failed ' + uploadResponse.statusText,
        icon: 'error',
        confirmButtonText: 'Okay',
      });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Error uploading file. Try again later',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
}

const checkToken = (navigate) => {
  const token = Cookies.get('jwt_token');
  if (!token) {
    navigate('/login');
    return null;
  }
  return token;
};



export const updateAddress = async (addressId, newAddress, navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    const response = await axios.post(API_ENDPOINT + 'update_address', {
      id: addressId,
      address: newAddress
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update address. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again'
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: error.response ? error.response.data.message : 'Error accessing the backend',
      icon: 'error',
      confirmButtonText: 'Try again later'
    });
  }
};

export const updateOrderAutoRefill = async (cart_id, auto_refill) => {
  try {
    const token = checkToken();
    if (!token) return;

    const response = await axios.post(API_ENDPOINT + 'update_order_auto_refill', {
      cart_id: cart_id,
      auto_refill: auto_refill
    }, {
      headers: {

        Authorization: `Bearer ${token}`,
      }
    });
    return response
  } catch (error) {
    Swal.fire({
      title: 'Error!',

      text: error.response ? error.response.data.message : 'Error accessing the backend',
      icon: 'error',
      confirmButtonText: 'Try again later'
    });
  }
};

export const addAddress = async (newAddress, navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    const response = await axios.post(API_ENDPOINT + 'add_address', {
      address: newAddress
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      return response.data;
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add address. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try again'
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: error.response ? error.response.data.message : 'Error accessing the backend',
      icon: 'error',
      confirmButtonText: 'Try again later'
    });
  }
};

export const deleteAddress = async (addressId, customerId, navigate) => {
  const token = checkToken(navigate);
  if (!token) return;

  await axios.post(
    API_ENDPOINT + "delete_address",
    {
      id: addressId,
      customer_id: customerId
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  Swal.fire("Deleted!", "Address deleted successfully.", "success");
};

export const listPrescriptions = async (navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return [];

    const response = await axios.get(API_ENDPOINT + 'list_prescriptions', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      return response.data.prescriptions;
    } else {
      return [];
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: error.response ? error.response.data.message : 'Error accessing the backend',
      icon: 'error',
      confirmButtonText: 'Try again later'
    });
    return [];
  }
};

export const listAddresses = async (navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    const response = await axios.get(API_ENDPOINT + 'list_addresses', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      return response.data.addresses;
    } else {
      return [];
    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: error.response ? error.response.data.message : 'Error accessing the backend',
      icon: 'error',
      confirmButtonText: 'Try again later'
    });
  }
};

export const selectAddress = async (addressId, navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    const response = await axios.post(API_ENDPOINT + 'select_address', {
      id: addressId
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      return
    } else {
      throw new Error('Failed to select address');
    }
  } catch (error) {
    throw new Error('Failed to select address: ' + error.message);
  }
};

export const getDefaultAddress = async (navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    const response = await axios.get(API_ENDPOINT + 'get_default_address', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      const defaultAddress = response.data;
      return defaultAddress;
    } else {
    }
  } catch (error) {

  }
};

export const searchSalt = async (search_term) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}search_composition_code`, {
      search_term: search_term
    });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching salts");
  }
};

export const searchVector = async (search_term) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}search`, {
      params: { q: search_term }
    });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching vector search results");
  }
};

export const searchProducts = async (
  searchText,
  page = 1,
  { category_name = "", show_hidden = false } = {}
) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}products`, {
      text: searchText,
      page,
      category_name,
      show_hidden
    });

    return response.data;
  } catch (error) {
    throw new Error("Error fetching products");
  }
};

export const searchsaltProducts = async (
  searchText,
  page = 1,
  { show_hidden = false, rc = null } = {}
) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}salt_products`, {
      text: searchText,
      page,
      show_hidden,
      rc
    });

    return response.data;
  } catch (error) {
    throw new Error("Error fetching products");
  }
};
export const search_altProducts = async (
  page = 1,
  {
    composition = "",
    exclude_product_id = null,
    rc = 1,
    show_hidden = false,
  } = {}
) => {
  try {
    const payload = {
      page,
      composition,
      exclude_product_id,
      rc,
      show_hidden,
    };

    const response = await axios.post(
      `${API_ENDPOINT}alt_products`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error("Error fetching alternate products");
  }
};

export const getProductsByCategory = async ({
  categoryId = null,
  categoryName = null,
  page = 1,
  perPage = 12,
  sortBy = "price_low_high",
  consumeType = null,
  composition = null,
  subCategories = []
}) => {
  try {
    const payload = {
      category_name: categoryName,
      page: page,
      per_page: perPage,
      sort_by: sortBy,
      consume_type: consumeType,
      composition: composition,
      sub_categories: subCategories
    };

    const response = await axios.post(
      `${API_ENDPOINT}get_products_by_category`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching products by category:", error);
    throw error;
  }
};


export const getBanner = async (section) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}banner`, {
      section: section
    });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching banner");
  }
};


export async function requestProduct(productId, customerId, prescriptionId, mode = "Insert", status = "PENDING") {
  try {
    const token = Cookies.get("jwt_token");

    const response = await axios.post(
      `${API_ENDPOINT}request-product`,
      {
        product_id: productId,
        customer_id: customerId,
        prescription_id: prescriptionId,
        status: status,
        mode
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      console.log("✅ Product request created:", response.data);
      return response.data;
    } else {
      console.error("Failed to create product request:", response.statusText);
      return null;
    }
  } catch (error) {
    console.error("Error creating product request:", error);
    return null;
  }
}

export const addToCart = async (productId = null, prescriptionId = 0, quantity = 1, navigate) => {
  try {
    const token = checkToken(navigate);
    if (!token) return;

    let payload = { prescription_id: prescriptionId };

    if (productId) {
      payload.product_id = productId;
      payload.quantity = quantity;
    }

    const response = await axios.post(`${API_ENDPOINT}add-to-cart`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    window.dispatchEvent(new Event('cartUpdated'));

    return response.data;
  } catch (error) {
    console.error("Cart API Error:", error);
    throw new Error("Error adding to cart");
  }
};

export const getProductDetails = async (id = 0, name = "") => {
  const response = await axios.get(API_ENDPOINT + `product_details/${id}?name=${name}`, {

  });
  return response.data;
}


export const loadCoupons = async (cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.get(`${API_ENDPOINT}cart_coupons/${cart_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    if (response.status === 200) {
      return response.data;
    }
    else {
      throw new Error('Failed to load coupons');
    }
  } catch (error) {
    throw new Error('Failed to load coupons: ' + error.message);
  }
}

export const applyCouponAPI = async (couponCode, cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    Swal.showLoading()
    const response = await axios.post(`${API_ENDPOINT}apply_coupon`, { coupon_code: couponCode, cart_id: cart_id }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    if (response.status === 200) {
      Swal.fire({
        title: 'Success!',
        text: 'Coupon applied successfully.',
        icon: 'success',
        timer: 1500,
        confirmButtonText: 'OK'
      });
      return response.data;

    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid coupon',
        icon: 'error',
        confirmButtonText: 'Okay',
      });

    }
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Invalid coupon',
      icon: 'error',
      confirmButtonText: 'Okay',
    });
  }
}


export const getCartCount = async (navigate) => {
  const token = checkToken(navigate);
  if (!token) return;

  const response = await axios.get(API_ENDPOINT + `cart_count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  return response.data;
}



export const removePrescriptionFromCart = async (cart_id) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}remove_prescription_from_cart`,
      { cart_id: cart_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const updateDeliveryCharge = async (cart_id, shipping_charge) => {
  const token = Cookies.get('jwt_token');
  try {
    const response = await axios.post(`${API_ENDPOINT}update_delivery_charge`,
      { cart_id: cart_id, shipping_charge: shipping_charge },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update delivery charge", error);
  }
};

export const assignOfferToCart = async (cart_id, offer_id) => {
  const token = Cookies.get('jwt_token');

  try {
    const response = await axios.post(
      `${API_ENDPOINT}cart/${cart_id}/assign-offer`,
      { offer_id: offer_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to assign offer", error);
  }
};

export const getCouponDetails = async (code) => {
  const response = await axios.get(API_ENDPOINT + `coupon_details/${code}`, {

  });
  return response.data;
}


export const getAllBlogCategories = async () => {
  const response = await axios.get(`${API_ENDPOINT}all_blog_categories`, {

  });
  return response.data;
};


export const getAllBlogs = async (popular = false, category_id = null) => {
  if (category_id === null) {
    const response = await axios.get(`${API_ENDPOINT}all_blogs?popular=${popular}`, {
    });
    return response.data;
  } else {
    const response = await axios.get(`${API_ENDPOINT}all_blogs?popular=${popular}&category_id=${category_id}`, {
    });
    return response.data;
  }


};


export const getBlog = async (blog_url = "") => {
  const response = await axios.post(`${API_ENDPOINT}get_blog`, {
    blog_url: blog_url
  });
  return response.data;
};

export const fetchBlogHtml = async (description_url) => {
  try {
    const response = await axios.get(
      `https://d1dh0rr5xj2p49.cloudfront.net/blogs/description/${description_url}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching blog description:", error);
  }
};

export const toggleLike = async (blog_url, token) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}blogs/${blog_url}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error.response?.data || { error: "Failed to toggle like" };
  }
};


export const postComment = async (blog_url, comment_text, parent_comment_id = null, token) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}blogs/${blog_url}/comments`,
      {
        comment_text,
        parent_comment_id,
      },

      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data; // returns the new comment object
  } catch (error) {
    console.error("Error posting comment:", error);
    throw error.response?.data || { error: "Failed to post comment" };
  }
};

export const editComment = async (blog_url, comment_id, comment_text, token) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}blogs/${blog_url}/comments/${comment_id}`,
      { comment_text },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error editing comment:", error);
    throw error.response?.data || { error: "Failed to edit comment" };
  }
};

export const deleteComment = async (blog_url, comment_id, token) => {
  try {
    const response = await axios.delete(
      `${API_ENDPOINT}blogs/${blog_url}/comments/${comment_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // { message: "Comment deleted successfully" }
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error.response?.data || { error: "Failed to delete comment" };
  }
};

export const fetchPolicyHtml = async (description_url) => {
  try {
    const response = await axios.get(`https://d1dh0rr5xj2p49.cloudfront.net/policies/` + description_url);
    return response.data;
  } catch (error) {
    console.error('Error fetching blog description:', error);
  }
};

const updateCartPayment = async (cart_id, payment_mode, cart_status = null) => {
  const token = Cookies.get('jwt_token');
  try {
    const payload = { cart_id, payment_mode };
    if (cart_status) payload.cart_status = cart_status;
    const response = await axios.post(
      `${API_ENDPOINT}cart/payment-update`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update cart payment", error);
    throw error;
  }
};

export { checkLogin, handleSignIn, getCategories, getProductList, getUser, handleSignOut, handleSignInwithOtp, updateCartPayment };

