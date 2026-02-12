/* eslint-disable import/first */
// Import side effects first and services

// Initialize services
import {
    setJSExceptionHandler,
    setNativeExceptionHandler
} from 'react-native-global-exception-handler';

// Handle JavaScript exceptions
setJSExceptionHandler((error, isFatal) => {
  console.log('JS Exception:', error, isFatal);
  // Send to error monitoring service
}, true); // Enable in dev mode

// Handle native exceptions
setNativeExceptionHandler((errorString) => {
  console.log('Native Exception:', errorString);
  // Send to error monitoring service
}, {
  forceAppToQuit: true,
  callPreviouslyDefinedHandler: false
});

// Register app entry through Expo Router
import "expo-router/entry";


