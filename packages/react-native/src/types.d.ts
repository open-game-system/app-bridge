// Type declarations for React Native specific globals

// Declare the global Expo object
declare namespace global {
  var expo:
    | {
        version?: string;
        Constants?: Record<string, any>;
      }
    | undefined;
}

// Declare the __DEV__ variable
declare const __DEV__: boolean;
