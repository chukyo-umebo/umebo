/* eslint-disable import/first */
// Import side effects first and services

// Initialize services
import {
    setJSExceptionHandler,
    setNativeExceptionHandler
} from 'react-native-global-exception-handler';
import { handleError } from './errorHandler';

// Handle JavaScript exceptions
setJSExceptionHandler(handleError, true); // Enable in dev mode

// Handle native exceptions
setNativeExceptionHandler((errorString) => {
    console.error('Native Exception:', errorString);
  // Send to error monitoring service
}, {
    forceAppToQuit: true,
    callPreviouslyDefinedHandler: false
});

// Register app entry through Expo Router
import "expo-router/entry";


