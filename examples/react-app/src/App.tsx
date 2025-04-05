import React, { useEffect, useState } from "react";
import { Counter } from "./Counter";

function App() {
  const [isBridgeDetected, setIsBridgeDetected] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if window.ReactNativeWebView exists
    const checkBridge = () => {
      const detected = typeof window !== 'undefined' && !!window.ReactNativeWebView;
      console.log("Bridge detection check:", detected);
      setIsBridgeDetected(detected);
    };
    
    // Check immediately
    checkBridge();
    
    // Handle message events - they might indicate we're in a WebView
    const handleMessage = (event: MessageEvent) => {
      console.log("Message received:", event.data);
      
      // Check bridge again after receiving a message - might have been initialized
      checkBridge();
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '4px',
        background: isBridgeDetected ? 'green' : 'red',
        color: 'white',
        textAlign: 'center',
        zIndex: 9999
      }}>
        Bridge Status: {isBridgeDetected ? 'Detected (Running in WebView)' : 'Not Detected (Running in Browser)'}
      </div>
      <Counter />
    </>
  );
}

export default App;
