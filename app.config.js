require('dotenv').config();

module.exports = {
  expo: {
    name: "VetApp",
    slug: "vet-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    sdkVersion: "54.0.0",

    splash: {
      image: "./assets/mobile-logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    fonts: [
      "./assets/fonts/Satoshi-Regular.otf",
      "./assets/fonts/Satoshi-Medium.otf",
      "./assets/fonts/Satoshi-Bold.otf",
      "./assets/fonts/Satoshi-Light.otf",
      "./assets/fonts/Satoshi-Black.otf"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vetclinic.staff",
      requireFullScreen: false
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.vetclinic.staff"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
      viewport: {
        width: 375,
        height: 812,
        initialScale: 1.0,
        minimumScale: 1.0,
        maximumScale: 1.0,
        userScalable: false
      }
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "vet-app",
    extra: {
      // Firebase
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      // EmailJS
      EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
      EMAILJS_USER_ID: process.env.EMAILJS_USER_ID,
      EMAILJS_PRIVATE_KEY: process.env.EMAILJS_PRIVATE_KEY,
      EMAILJS_STAFF_TEMPLATE_ID: process.env.EMAILJS_STAFF_TEMPLATE_ID,
      EMAILJS_WELCOME_TEMPLATE_ID: process.env.EMAILJS_WELCOME_TEMPLATE_ID,
      // Veterinarian EmailJS
      EMAILJS_VET_SERVICE_ID: process.env.EMAILJS_VET_SERVICE_ID,
      EMAILJS_VET_TEMPLATE_ID: process.env.EMAILJS_VET_TEMPLATE_ID,
      EMAILJS_VET_PUBLIC_KEY: process.env.EMAILJS_VET_PUBLIC_KEY,
      // Other
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    }
  }
};
