import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut as fbSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
} from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import type { User as CloudUser } from "@supabase/supabase-js";

const firebaseConfig = {
  apiKey: "AIzaSyD3K3woseGtLUbE8Jf6bm_jijmSm-eVUy4",
  authDomain: "shopsense-1e4bf.firebaseapp.com",
  projectId: "shopsense-1e4bf",
  storageBucket: "shopsense-1e4bf.firebasestorage.app",
  messagingSenderId: "274633995921",
  appId: "1:274633995921:web:c99ee18c4aacc91ccfb130",
  measurementId: "G-CXWN5DHFDS",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export type User = {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  isAnonymous: boolean;
  provider: "google" | "firebase" | "guest";
};

const GUEST_KEY = "shopsense_guest_user_v1";
const AUTH_EVENT = "shopsense-auth-change";

const mapFirebaseUser = (u: FirebaseUser | null): User | null =>
  u
    ? {
        uid: u.uid,
        displayName: u.displayName,
        photoURL: u.photoURL,
        email: u.email,
        isAnonymous: u.isAnonymous,
        provider: u.isAnonymous ? "guest" : "firebase",
      }
    : null;

const mapCloudUser = (u: CloudUser | null | undefined): User | null => {
  if (!u) return null;
  const meta = u.user_metadata || {};
  return {
    uid: u.id,
    displayName: meta.full_name || meta.name || u.email?.split("@")[0] || "Google user",
    photoURL: meta.avatar_url || meta.picture || null,
    email: u.email || null,
    isAnonymous: false,
    provider: "google",
  };
};

export const getPersistedGuestUser = (): User | null => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const setGuestUser = (user: User | null, emit = true) => {
  if (user) localStorage.setItem(GUEST_KEY, JSON.stringify(user));
  else localStorage.removeItem(GUEST_KEY);
  if (emit) window.dispatchEvent(new Event(AUTH_EVENT));
};

export const signInWithGoogle = async () => {
  setGuestUser(null, false);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  try {
    const result = await signInWithPopup(auth, provider);
    // User is now signed in with Google via Firebase
    return { user: result.user };
  } catch (error: any) {
    throw new Error(error.message || "Google sign-in failed");
  }
};

// Removed: consumeRedirectResult no longer needed with popup auth

export const signInAsGuest = async () => {
  await Promise.allSettled([supabase.auth.signOut(), fbSignOut(auth)]);
  const guest: User = {
    uid: `guest_${crypto.randomUUID()}`,
    displayName: "Guest",
    photoURL: null,
    email: null,
    isAnonymous: true,
    provider: "guest",
  };
  setGuestUser(guest);
  return { user: guest };
};

export const signOut = async () => {
  setGuestUser(null, false);
  await Promise.allSettled([supabase.auth.signOut(), fbSignOut(auth)]);
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const onAuth = (cb: (u: User | null) => void) => {
  let cloudUser: User | null = null;
  let firebaseUser: User | null = null;
  let cloudReady = false;
  let firebaseReady = false;

  const notify = () => {
    if (!cloudReady || !firebaseReady) return;
    cb(cloudUser || firebaseUser || getPersistedGuestUser());
  };

  supabase.auth.getSession().then(({ data }) => {
    cloudUser = mapCloudUser(data.session?.user);
    cloudReady = true;
    if (cloudUser) setGuestUser(null, false);
    notify();
  }).catch(() => {
    cloudReady = true;
    notify();
  });

  const { data: cloudSub } = supabase.auth.onAuthStateChange((_event, session) => {
    cloudUser = mapCloudUser(session?.user);
    cloudReady = true;
    if (cloudUser) setGuestUser(null, false);
    notify();
  });

  const firebaseUnsub = onAuthStateChanged(
    auth,
    (u) => {
      firebaseUser = mapFirebaseUser(u);
      firebaseReady = true;
      if (firebaseUser) setGuestUser(null, false);
      notify();
    },
    () => {
      firebaseReady = true;
      notify();
    },
  );

  const guestListener = () => notify();
  window.addEventListener(AUTH_EVENT, guestListener);

  return () => {
    cloudSub.subscription.unsubscribe();
    firebaseUnsub();
    window.removeEventListener(AUTH_EVENT, guestListener);
  };
};
