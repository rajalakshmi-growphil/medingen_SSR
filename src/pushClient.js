
import Cookies from "js-cookie";
import axios from "axios";
import React, { useEffect } from "react";
import { subscribeNotification } from "./api/Api";

const API_ENDPOINT = 'https://medingen.in/api/';
// const API_ENDPOINT = 'http://localhost:8001/api/';

export const VAPID_PUBLIC_KEY = "BNNlFfaKsEoVtmmMiHrbUSgyH1Qx1ae5sDoQjLlAcHOVmo2G_w9tonIWCWEqTyEfNKghhw2ozaypQYSWRaVJwvw";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

const CLOUD_FRONT_BASE = "https://d1dh0rr5xj2p49.cloudfront.net/notifications";
const DEFAULT_ICON = "/android-chrome-192x192.png";
const DEFAULT_BADGE = "/migfulllogo.png";

export const sendSystemNotification = async ({
  title,
  message = "",
  url = "/cart",
  icon = DEFAULT_ICON,
  badge = DEFAULT_BADGE,
  image,
} = {}) => {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    }

    const registration = await navigator.serviceWorker.ready;

    if (!title && message) {
      const match = message.match(/^([^.!?]+[.!?])\s*(.*)/s);
      if (match) {
        title = match[1].trim();  
        message = match[2].trim(); 
      } else {
        title = message; 
        message = "";
      }
    }

    const options = {
      body: message,
      icon,
      badge,
      requireInteraction: true,
      silent: false,
      vibrate: [80, 40, 80],
      timestamp: Date.now(),
      actions: [
        { action: "open", title: "View Details" },
        { action: "shop", title: "Shop Now" },
      ],
      data: { url: url || "/cart" },
      tag: "medingen-push",
      renotify: true,
    };
    if (image) options.image = image;

    await registration.showNotification(title, options);
  } catch (e) {
    console.error("Failed:", e);
  }
};

const NOTI_SEEN_KEY = "medingen_shown_notifications_v1";

function getShownSet() {
  try {
    const raw = localStorage.getItem(NOTI_SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function markShown(id) {
  try {
    const set = getShownSet();
    set.add(String(id));
    localStorage.setItem(NOTI_SEEN_KEY, JSON.stringify([...set]));
  } catch (e) {
    console.error("markShown error:", e);
  }
}

function hasBeenShown(id) {
  return getShownSet().has(String(id));
}

function parseWhen(n) {
  return Date.parse((n && n.date_received) || (n && n.date) || 0);
}

function scheduleOnce(ts, cb) {
  const now = Date.now();
  const delay = Math.max(0, ts - now);
  const MAX_DELAY = 24 * 60 * 60 * 1000;
  if (delay > MAX_DELAY) return;
  setTimeout(cb, delay);
}

export const fetchAndNotifyLatest = async ({
  page = 1,
  onlyUnread = false,
} = {}) => {
  const token = Cookies.get("jwt_token");
  if (!token) {
    console.warn("No JWT token found. Skipping notifications.");
    return;
  }

  try {
    const res = await axios.get(`${API_ENDPOINT}notifications?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const list = Array.isArray(res.data.notifications)
      ? res.data.notifications
      : [];
    if (list.length === 0) return res.data;

    let items = onlyUnread ? list.filter(n => n.read_status === null) : list;
    items = items.filter(n => !!n?.message?.trim() && !hasBeenShown(n.id));
    if (items.length === 0) return res.data;

    items.sort((a, b) => parseWhen(a) - parseWhen(b));
    const now = Date.now();

    items.forEach((n) => {
      const when = parseWhen(n);
      const fullMsg = n.message?.trim() || "";

      let title, body;
      const match = fullMsg.match(/^([^.!?]+[.!?])\s*(.*)/s);
      if (match) {
        title = match[1].trim(); 
        body = match[2].trim();  
      } else {
        title = fullMsg;
        body = "";
      }

      const imageUrl = n.image ? `${CLOUD_FRONT_BASE}/${n.image}` : undefined;

      const targetUrl = "/";

      const show = () => {
        if (hasBeenShown(n.id)) return;

        sendSystemNotification({
          title,
          message: body,
          url: targetUrl,
          icon: DEFAULT_ICON,
          badge: DEFAULT_BADGE,
          image: imageUrl,
        }).catch((e) => console.error("System notification error:", e));

        markShown(n.id);
      };

      if (isNaN(when) || when <= now) show();
      else scheduleOnce(when, show);
    });

    return res.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};


export async function requestNotificationPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("Notifications or Service Worker not supported");
    return null;
  }

  if (!window.isSecureContext && location.hostname !== "localhost") {
    console.warn("Web Push requires a secure context (https). Current origin is not secure.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  if (!registration || !registration.pushManager) {
    console.error("Service worker registration or pushManager missing", registration);
    return null;
  }

  try {
    const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    try {
      const latestSubscription = await subscribeNotification(subscription);
      console.log("Subscribed and synced:", latestSubscription);
      return latestSubscription;
    } catch (backendErr) {
      console.error("Failed to sync subscription with backend:", backendErr);
      return subscription;
    }
  } catch (err) {
    console.error("pushManager.subscribe failed:", {
      name: err && err.name,
      message: err && err.message,
      stack: err && err.stack,
    });


    if (err && err.name === "InvalidStateError") {
      console.warn("InvalidStateError: possible reasons: subscription already exists, or service worker state mismatch.");
    }
    if (err && err.name === "NotAllowedError") {
      console.warn("NotAllowedError: permission denied for notifications.");
    }
    if (err && err.message && err.message.toLowerCase().includes("push service")) {
      console.warn("Push service error - check network, Chrome push service status, or VAPID key validity.");
    }

    return null;
  }
}

export async function ensurePushSubscription(maxRetries = 3) {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported in this environment");
    return null;
  }

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return null;
  }
  if (Notification.permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error("ServiceWorker.ready did not resolve to a registration");
      return null;
    }

    // console.log("Service worker registration:", {
    //   scope: registration.scope,
    //   scriptURL: registration.active?.scriptURL,
    //   hasActive: Boolean(registration.active),
    // });

    let subscription = await registration.pushManager.getSubscription();
    // console.log("Existing subscription:", subscription);

    if (!subscription) {
      const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY || "");
      if (!applicationServerKey || applicationServerKey.length < 10) {
        console.error("Invalid VAPID_PUBLIC_KEY. Check your config.");
        return null;
      }

      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          console.log(`Attempting push subscribe (attempt ${attempt + 1})`);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
          console.log("New subscription created:", subscription);
          break; 
        } catch (err) {
          console.error("Subscribe() failed:", { name: err?.name, message: err?.message });
          if (err?.name === "AbortError" && attempt < maxRetries - 1) {
            const backoff = 500 * Math.pow(2, attempt); 
            console.warn(`AbortError - retrying in ${backoff}ms`);
            await new Promise(r => setTimeout(r, backoff));
            attempt++;
            continue;
          }
          return null; 
        }
      }
    } else {
      // console.log("Using existing subscription");
    }

    try {
      const latestSubscription = await subscribeNotification(subscription);
      // console.log("Synced subscription to backend");
      return latestSubscription;
    } catch (err) {
      console.error("Failed to sync subscription to backend:", err);
      return subscription;
    }

  } catch (err) {
    console.error("EnsurePushSubscription failed:", { name: err?.name, message: err?.message, stack: err?.stack });
    return null;
  }
}

export const PwaManager = () => {
  const token = Cookies.get("jwt_token");

  useEffect(() => {
    if (!token) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          ensurePushSubscription();
        }
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => ensurePushSubscription())
        .catch((e) => console.error("EnsurePushSubscription error:", e));
    }
    const requestAndSubscribe = async () => {
      try {
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            console.log("Permission granted");
            await ensurePushSubscription();
          } else {
            console.warn("Permission not granted");
          }
        } else if (Notification.permission === "granted") {
          await ensurePushSubscription();
        } else {
          console.warn("Permission denied previously. User must enable manually.");
        }
      } catch (err) {
        console.error("RequestAndSubscribe error:", err);
      }
    };

    requestAndSubscribe();

    let intervalId;
    const pollNotifications = async () => {
      if (!document.hidden) {
        try {
          await fetchAndNotifyLatest({ onlyUnread: true });
        } catch (err) {
          console.error("FetchAndNotifyLatest error:", err);
        }
      }
    };
    pollNotifications();
    intervalId = setInterval(pollNotifications, 2 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token]);
  return null;
};


