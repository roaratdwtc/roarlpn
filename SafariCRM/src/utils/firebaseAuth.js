// Firebase Authentication Service for WhatsApp / Phone Number Login
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

// Production Firebase Config provided by User
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_Q5uMNoVd1lRF02dbkSPwWwA-j7l5Mss",
  authDomain: "roar-safari-crm.firebaseapp.com",
  projectId: "roar-safari-crm",
  storageBucket: "roar-safari-crm.firebasestorage.app",
  messagingSenderId: "1036161032779",
  appId: "1:1036161032779:web:6bbb3e26919f9798bd63ce"
};

/**
 * Get active Firebase config from localStorage
 */
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem('safari_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read safari_firebase_config:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Save custom Firebase credentials
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('safari_firebase_config', JSON.stringify(config));
    appInstance = null;
    authInstance = null;
    return true;
  } catch (e) {
    console.error("Failed to save safari_firebase_config:", e);
    return false;
  }
}

/**
 * Check if real Firebase API Key and Project ID are configured
 */
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 10 && cfg.projectId && cfg.projectId.trim().length > 2);
}

let appInstance = null;
let authInstance = null;

export function initFirebase() {
  const config = getFirebaseConfig();
  if (!config.apiKey || !config.projectId) return null;

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    return authInstance;
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    return null;
  }
}

/**
 * Setup reCAPTCHA verifier for Phone Auth
 */
export function setupRecaptcha(containerId = 'recaptcha-container') {
  const auth = initFirebase();
  if (!auth) {
    throw new Error("Firebase is not configured. Real Auth keys are required.");
  }

  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`reCAPTCHA container #${containerId} not found in DOM.`);
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn("reCAPTCHA expired. Please try again.");
      }
    });

    return window.recaptchaVerifier;
  } catch (e) {
    console.error("Error setting up reCAPTCHA verifier:", e);
    throw e;
  }
}

/**
 * Format international phone number (+971...)
 */
export function formatPhoneNumber(phoneNumber) {
  let clean = (phoneNumber || '').trim().replace(/[\s-()]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return '+' + clean.slice(2);
  if (clean.startsWith('05')) return '+971' + clean.slice(1);
  if (clean.startsWith('5')) return '+971' + clean;
  return '+' + clean;
}

/**
 * Send Phone / WhatsApp OTP
 * STRICT: Requires real Firebase configuration. Throws error if keys are missing.
 */
export async function sendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase Authentication keys are missing. Please provide your real Firebase configuration keys to send OTP.");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone || formattedPhone.length < 9) {
    throw new Error("Please enter a valid international mobile phone number (e.g. +971501234567).");
  }

  const auth = initFirebase();
  if (!auth) {
    throw new Error("Could not initialize Firebase Auth with the provided credentials. Please check your API Key and Project ID.");
  }

  const verifier = setupRecaptcha(containerId);
  if (!verifier) {
    throw new Error("Unable to initialize reCAPTCHA verifier.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return {
      success: true,
      mode: 'firebase',
      confirmationResult,
      formattedPhone,
      message: `Realtime OTP sent to ${formattedPhone}. Please check your phone for the 6-digit code.`
    };
  } catch (err) {
    console.error("Firebase signInWithPhoneNumber failed:", err);
    let userMsg = err.message || "Failed to send OTP.";
    if (err.code === 'auth/invalid-phone-number') {
      userMsg = "The phone number format is invalid. Please include international country code (e.g. +971...).";
    } else if (err.code === 'auth/missing-phone-number') {
      userMsg = "Phone number is required.";
    } else if (err.code === 'auth/quota-exceeded') {
      userMsg = "SMS quota exceeded for this Firebase project. Check Firebase Console billing/quota.";
    } else if (err.code === 'auth/captcha-check-failed') {
      userMsg = "reCAPTCHA check failed. Please refresh and try again.";
    } else if (err.code === 'auth/unauthorized-domain') {
      userMsg = `Current domain (${window.location.hostname}) is not authorized in Firebase Console > Authentication > Settings > Authorized domains.`;
    } else if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
      userMsg = "Google Firebase SMS requires UAE (+971) to be enabled in Firebase Console (Authentication > Settings > SMS region policy). You can verify via WhatsApp OTP immediately.";
    }
    throw new Error(userMsg);
  }
}

/**
 * Verify OTP Code
 * STRICT: Only accepts real Firebase confirmation result.
 */
export async function verifyPhoneOtp(otpResponse, enteredCode) {
  const trimmed = (enteredCode || '').trim();
  if (!trimmed || trimmed.length < 6) {
    throw new Error("Please enter the complete 6-digit verification code.");
  }

  if (!otpResponse || !otpResponse.confirmationResult) {
    throw new Error("Verification session expired. Please request a new OTP.");
  }

  try {
    const userCredential = await otpResponse.confirmationResult.confirm(trimmed);
    return {
      success: true,
      user: userCredential.user,
      phoneNumber: otpResponse.formattedPhone || userCredential.user.phoneNumber
    };
  } catch (err) {
    console.error("Firebase confirm error:", err);
    let userMsg = err.message || "Invalid verification code.";
    if (err.code === 'auth/invalid-verification-code') {
      userMsg = "Invalid verification code. Please check the 6-digit code sent to your phone.";
    } else if (err.code === 'auth/code-expired') {
      userMsg = "Verification code has expired. Please request a new OTP.";
    }
    throw new Error(userMsg);
  }
}

/**
 * Sign Out from Firebase
 */
export async function signOutFirebase() {
  if (authInstance) {
    try {
      await firebaseSignOut(authInstance);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }
}

// Firestore Realtime Tables Service
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc 
} from 'firebase/firestore';

let firestoreInstance = null;

export function getFirestoreDb() {
  const auth = initFirebase();
  if (!auth) return null;
  try {
    if (!firestoreInstance && appInstance) {
      firestoreInstance = getFirestore(appInstance);
    }
    return firestoreInstance;
  } catch (e) {
    console.warn("Firestore database initialization warning:", e);
    return null;
  }
}

/**
 * Sync user profile to Firestore 'users' table
 */
export async function syncUserToFirestore(user) {
  const db = getFirestoreDb();
  if (!db || !user?.phone) return;
  try {
    const docId = (user.phone || '').replace(/\D/g, '');
    const docRef = doc(db, 'users', docId);
    await setDoc(docRef, user, { merge: true });
  } catch (e) {
    console.warn("syncUserToFirestore note:", e);
  }
}

/**
 * Sync invite code to Firestore 'invites' table
 */
export async function syncInviteToFirestore(invite) {
  const db = getFirestoreDb();
  if (!db || !invite?.code) return;
  try {
    const docRef = doc(db, 'invites', invite.code);
    await setDoc(docRef, invite, { merge: true });
  } catch (e) {
    console.warn("syncInviteToFirestore note:", e);
  }
}

/**
 * Mark invite as used in Firestore
 */
export async function markInviteUsedInFirestore(inviteCode, phone) {
  const db = getFirestoreDb();
  if (!db || !inviteCode) return;
  try {
    const docRef = doc(db, 'invites', inviteCode);
    await updateDoc(docRef, {
      isUsed: true,
      usedAt: new Date().toISOString(),
      usedByPhone: phone
    });
  } catch (e) {
    console.warn("markInviteUsedInFirestore note:", e);
  }
}

/**
 * Fetch invite from Firestore 'invites' table
 */
export async function fetchInviteFromFirestore(inviteCode) {
  const db = getFirestoreDb();
  if (!db || !inviteCode) return null;
  try {
    const docRef = doc(db, 'invites', inviteCode.trim().toUpperCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.warn("fetchInviteFromFirestore note:", e);
  }
  return null;
}

/**
 * Sync freelancer receipt to Firestore 'receipts' table
 */
export async function syncReceiptToFirestore(receipt) {
  const db = getFirestoreDb();
  if (!db || !receipt?.id) return;
  try {
    const docRef = doc(db, 'receipts', receipt.id);
    await setDoc(docRef, receipt, { merge: true });
  } catch (e) {
    console.warn("syncReceiptToFirestore note:", e);
  }
}
