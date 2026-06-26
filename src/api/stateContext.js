import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { getCartData, getProfileData, getUser } from './Api';

// Create the contexts
const CartContext = createContext();
const CompareContext = createContext();
const ProfileContext = createContext();

// Define actions for both contexts
const UPDATE_COUNT = 'UPDATE_COUNT';
const SET_CART_ITEMS = 'SET_CART_ITEMS';
const ADD_TO_COMPARE = 'ADD_TO_COMPARE';
const REMOVE_FROM_COMPARE = 'REMOVE_FROM_COMPARE';
const START_PROFILE_FETCH = 'START_PROFILE_FETCH';
const SET_PROFILE = 'SET_PROFILE';
const CLEAR_PROFILE = 'CLEAR_PROFILE';

// Initial state for cart
const initialCartState = {
  itemCount: 0,
  cartItems: [],
  cartId: null
};

// Initial state for compare
const initialCompareState = {
  compareProducts: [], // List of product objects
};

// Reducer function to handle state changes for cart
const cartReducer = (state, action) => {
  switch (action.type) {
    case UPDATE_COUNT:
      return {
        ...state,
        itemCount: action.payload,
      };
    case SET_CART_ITEMS:
      const items = action.payload.items || [];
      const totalCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return {
        ...state,
        cartItems: items,
        cartId: action.payload.cartId || state.cartId,
        itemCount: totalCount,
      };
    default:
      return state;
  }
};

// Reducer function to handle state changes for compare
const compareReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_COMPARE:
      // Check if the product is already in compareProducts
      const exists = state.compareProducts.some(
        product => product.product_id === action.payload.product_id
      );
      if (exists) {
        return state; // Return current state if product already exists
      }
      return {
        ...state,
        compareProducts: [...state.compareProducts, action.payload],
      };
    case REMOVE_FROM_COMPARE:
      return {
        ...state,
        compareProducts: state.compareProducts.filter(
          product => product.product_id !== action.payload.product_id
        ),
      };
    default:
      return state;
  }
};

// Reducer for profile
const profileReducer = (state, action) => {
  switch (action.type) {
    case START_PROFILE_FETCH:
      return { ...state, loading: true };
    case SET_PROFILE:
      return { ...state, data: action.payload, loading: false };
    case CLEAR_PROFILE:
      return { data: null, loading: false };
    default:
      return state;
  }
};

// Load cart state from local storage if available
const loadCartState = () => {
  const savedState = localStorage.getItem('cartState');
  return savedState ? JSON.parse(savedState) : initialCartState;
};

// Load compare state from local storage if available
const loadCompareState = () => {
  const savedState = localStorage.getItem('compareState');
  return savedState ? JSON.parse(savedState) : initialCompareState;
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, loadCartState());
  const latestState = useRef(state);

  // Store cart state in local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartState', JSON.stringify(state));
    latestState.current = state;
  }, [state]);

  const fetchAndUpdateCart = useCallback(() => {
    getCartData().then(res => {
      let rawItems = [];
      if (res && res.data && res.data.cart) {
        rawItems = Array.isArray(res.data.cart) ? res.data.cart : [];
      } else if (res && res.data && res.data.cart_items) {
        if (Array.isArray(res.data.cart_items)) {
          rawItems = res.data.cart_items;
        } else if (typeof res.data.cart_items === "string") {
          const itemsStr = res.data.cart_items;
          rawItems = itemsStr
            .split(";")
            .filter((part) => part.trim() !== "")
            .map((part) => {
              const [id, q] = part.split(":");
              return { product_id: id.trim(), quantity: (q || "1").trim() };
            });
        }
      }

      // Filter to only include items that actually exist in the cart (quantity > 0)
      const activeItems = rawItems.filter(item => Number(item.quantity) > 0);
      const cartId = (res && res.data && res.data.cart_id) ? res.data.cart_id : null;
      dispatch({ type: SET_CART_ITEMS, payload: { items: activeItems, cartId } });
    }).catch(() => { });
  }, []);

  // Listen for cross-tab updates and explicit app-wide `cartUpdated` events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cartState' && e.newValue) {
        const newState = JSON.parse(e.newValue);
        const currentState = latestState.current;
        if (newState.itemCount !== currentState.itemCount || JSON.stringify(newState.cartItems) !== JSON.stringify(currentState.cartItems)) {
          dispatch({ type: SET_CART_ITEMS, payload: { items: newState.cartItems || [], cartId: newState.cartId } });
        }
      }
    };

    // Listen for manual cart clear events (e.g., on logout or token invalid)
    const handleClearCart = () => {
      dispatch({ type: SET_CART_ITEMS, payload: { items: [], cartId: null } });
    };

    // Listen to tab storage changes
    window.addEventListener('storage', handleStorageChange);
    // Listen to explicit app updates
    window.addEventListener('cartUpdated', fetchAndUpdateCart);
    window.addEventListener('clearCart', handleClearCart);

    // Initial fetch on mount to guarantee fresh count inside the application
    fetchAndUpdateCart();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', fetchAndUpdateCart);
      window.removeEventListener('clearCart', handleClearCart);
    };
  }, [fetchAndUpdateCart]);

  return (
    <CartContext.Provider value={{ itemCount: state.itemCount, cartItems: state.cartItems, cartId: state.cartId, refreshCartCount: fetchAndUpdateCart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// Compare provider component
export const CompareProvider = ({ children }) => {
  const [state, dispatchCompare] = useReducer(compareReducer, loadCompareState());

  // Store compare state in local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('compareState', JSON.stringify(state));
  }, [state]);

  return (
    <CompareContext.Provider value={{ compareProducts: state.compareProducts, dispatchCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

// Profile provider component
export const ProfileProvider = ({ children }) => {
  const [state, dispatchProfile] = useReducer(profileReducer, { data: null, loading: true });

  const fetchProfile = useCallback(() => {
    dispatchProfile({ type: START_PROFILE_FETCH });
    const user = getUser();
    if (user.isLoggedIn) {
      getProfileData().then(data => {
        dispatchProfile({ type: SET_PROFILE, payload: data });
      }).catch((err) => {
        console.error("Failed to fetch profile data:", err);
        dispatchProfile({ type: CLEAR_PROFILE });
      });
    } else {
      dispatchProfile({ type: CLEAR_PROFILE });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    window.addEventListener('profileUpdated', fetchProfile);
    window.addEventListener('clearCart', () => dispatchProfile({ type: CLEAR_PROFILE }));
    return () => {
      window.removeEventListener('profileUpdated', fetchProfile);
    };
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile: state.data, loading: state.loading, refreshProfile: fetchProfile, dispatchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook to use the profile context
export const useProfile = () => useContext(ProfileContext);

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);

// Custom hook to use the compare context
export const useCompare = () => useContext(CompareContext);