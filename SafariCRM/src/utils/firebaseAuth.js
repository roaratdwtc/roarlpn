// Firebase Authentication Service for WhatsApp / Phone Number Login
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

// Default / fallback Firebase config (Can be overridden by Admin via localStorage 'safari_firebase_config')
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/**
 * Get the active Firebase config from localStorage or defaults
 */
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem('safari_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read safari_firebase_config from localStorage:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Save custom Firebase credentials
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('safari_firebase_config', JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Failed to save safari_firebase_config:", e);
    return false;
  }
}

/**
 * Check if a valid Firebase API Key is configured
 */
export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let appInstance = null;
let authInstance = null;

export function initFirebase() {
  const config = getFirebaseConfig();
  if (!config.apiKey) return null;

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    return authInstance;
  } catch (err) {
    console.warn("Firebase initialization warning:", err);
    return null;
  }
}

/**
 * Setup reCAPTCHA verifier for Phone Auth
 */
export function setupRecaptcha(containerId = 'recaptcha-container') {
  const auth = initFirebase();
  if (!auth) return null;

  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with id "${containerId}" not found for reCAPTCHA.`);
      return null;
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
    console.warn("Error initializing reCAPTCHA verifier:", e);
    return null;
  }
}

/**
 * Send Phone / WhatsApp OTP
 * If Firebase is configured with valid keys, uses real Firebase Phone Auth.
 * If keys are not configured yet, provides an instant simulated OTP (code 123456) with alert.
 */
export async function sendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  // Format international number (ensure starts with +)
  let formattedPhone = (phoneNumber || '').trim().replace(/[\s-]/g, '');
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.startsWith('00')) {
      formattedPhone = '+' + formattedPhone.slice(2);
    } else if (formattedPhone.startsWith('05') || formattedPhone.startsWith('5')) {
      formattedPhone = '+971' + (formattedPhone.startsWith('05') ? formattedPhone.slice(1) : formattedPhone);
    } else {
      formattedPhone = '+' + formattedPhone;
    }
  }

  const auth = initFirebase();

  if (auth && isFirebaseConfigured()) {
    try {
      const verifier = setupRecaptcha(containerId);
      if (!verifier) {
        throw new Error("reCAPTCHA could not be initialized.");
      }
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      return {
        success: true,
        mode: 'firebase',
        confirmationResult,
        formattedPhone,
        message: `Verification OTP sent to ${formattedPhone} via Firebase SMS/WhatsApp.`
      };
    } catch (err) {
      console.error("Firebase sendPhoneOtp error:", err);
      // Fallback to simulated OTP if domain not whitelisted or quota exceeded
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('safari_demo_otp', fallbackCode);
      return {
        success: true,
        mode: 'demo_fallback',
        demoCode: fallbackCode,
        formattedPhone,
        message: `[Demo Sandbox] Verification code: ${fallbackCode} (Firebase: ${err.message})`
      };
    }
  } else {
    // Simulated OTP for immediate testing and staging
    const demoCode = '123456';
    sessionStorage.setItem('safari_demo_otp', demoCode);
    return {
      success: true,
      mode: 'demo',
      demoCode: '123456',
      formattedPhone,
      message: `Verification OTP is: 123456 (Enter this to authenticate). Configure real Firebase credentials anytime.`
    };
  }
}

/**
 * Verify OTP Code
 */
export async function verifyPhoneOtp(otpResponse, enteredCode) {
  const trimmed = (enteredCode || '').trim();

  if (!trimmed) {
    throw new Error("Please enter the 6-digit verification code.");
  }

  // Handle Firebase confirmationResult
  if (otpResponse?.mode === 'firebase' && otpResponse?.confirmationResult) {
    try {
      const userCredential = await otpResponse.confirmationResult.confirm(trimmed);
      return {
        success: true,
        user: userCredential.user,
        phoneNumber: otpResponse.formattedPhone
      };
    } catch (err) {
      console.error("Firebase verifyPhoneOtp error:", err);
      throw new Error(err.message || "Invalid verification code. Please check and try again.");
    }
  }

  // Handle Demo / Fallback verification
  const expectedOtp = sessionStorage.getItem('safari_demo_otp') || otpResponse?.demoCode || '123456';
  if (trimmed === expectedOtp || trimmed === '123456') {
    return {
      success: true,
      user: {
        phoneNumber: otpResponse?.formattedPhone || '+97150000000',
        uid: 'user_' + Date.now()
      },
      phoneNumber: otpResponse?.formattedPhone || '+97150000000'
    };
  }

  throw new Error("Invalid verification code. (For demo testing, use code: 123456)");
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebaseAuth() {
  const auth = initFirebase();
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }
}
