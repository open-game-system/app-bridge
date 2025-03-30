declare global {
  // Add type for global.expo
  namespace NodeJS {
    interface Global {
      expo?: {
        version?: string;
        Constants?: Record<string, any>;
      };
    }
  }
}

export {}; 