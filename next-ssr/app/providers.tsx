"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { getCartData, getProfileData, getUser } from '../lib/api';

// Create the contexts
const CartContext = createContext<any>(null);
const CompareContext = createContext<any>(null);
const ProfileContext = createContext<any>(null);

// Action types
const UPDATE_COUNT = 'UPDATE_COUNT';
const SET_CART_ITEMS = 'SET_CART_ITEMS';
const ADD_TO_COMPARE = 'ADD_TO_COMPARE';
const REMOVE_FROM_COMPARE = 'REMOVE_FROM_COMPARE';
const START_PROFILE_FETCH = 'START_PROFILE_FETCH';
const SET_PROFILE = 'SET_PROFILE';
const CLEAR_PROFILE = 'CLEAR_PROFILE';

// Initial states
const initialCartState = {
  itemCount: 0,
  cartItems: [] as any[],
  cartId: null as string | null
};

const initialCompareState = {
  compareProducts: [] as any[],
};

// Reducers
const cartReducer = (state: typeof initialCartState, action: any) => {
  switch (action.type) {
    case UPDATE_COUNT:
      return {
        ...state,
        itemCount: action.payload,
      };
    case SET_CART_ITEMS:
      const items = action.payload.items || [];
      const totalCount = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
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

const compareReducer = (state: typeof initialCompareState, action: any) => {
  switch (action.type) {
    case ADD_TO_COMPARE:
      const exists = state.compareProducts.some(
        product => product.product_id === action.payload.product_id
      );
      if (exists) {
        return state;
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

const profileReducer = (state: any, action: any) => {
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

// Local storage helpers
const loadCartState = () => {
  if (typeof window === "undefined") return initialCartState;
  const savedState = localStorage.getItem('cartState');
  return savedState ? JSON.parse(savedState) : initialCartState;
};

const loadCompareState = () => {
  if (typeof window === "undefined") return initialCompareState;
  const savedState = localStorage.getItem('compareState');
  return savedState ? JSON.parse(savedState) : initialCompareState;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState, () => {
    return loadCartState();
  });
  const latestState = useRef(state);

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
            .filter((part: string) => part.trim() !== "")
            .map((part: string) => {
              const [id, q] = part.split(":");
              return { product_id: id.trim(), quantity: (q || "1").trim() };
            });
        }
      }

      const activeItems = rawItems.filter((item: any) => Number(item.quantity) > 0);
      const cartId = (res && res.data && res.data.cart_id) ? res.data.cart_id : null;
      dispatch({ type: SET_CART_ITEMS, payload: { items: activeItems, cartId } });
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cartState' && e.newValue) {
        const newState = JSON.parse(e.newValue);
        const currentState = latestState.current;
        if (newState.itemCount !== currentState.itemCount || JSON.stringify(newState.cartItems) !== JSON.stringify(currentState.cartItems)) {
          dispatch({ type: SET_CART_ITEMS, payload: { items: newState.cartItems || [], cartId: newState.cartId } });
        }
      }
    };

    const handleClearCart = () => {
      dispatch({ type: SET_CART_ITEMS, payload: { items: [], cartId: null } });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', fetchAndUpdateCart);
    window.addEventListener('clearCart', handleClearCart);

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

export const CompareProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatchCompare] = useReducer(compareReducer, initialCompareState, () => {
    return loadCompareState();
  });

  useEffect(() => {
    localStorage.setItem('compareState', JSON.stringify(state));
  }, [state]);

  return (
    <CompareContext.Provider value={{ compareProducts: state.compareProducts, dispatchCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
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

export const useProfile = () => useContext(ProfileContext);
export const useCart = () => useContext(CartContext);
export const useCompare = () => useContext(CompareContext);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CompareProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </CompareProvider>
    </CartProvider>
  );
}
