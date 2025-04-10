import React from 'react';
import { View } from 'react-native';

const MockWebView = (props) => {
  return <View {...props} />;
};

MockWebView.prototype.postMessage = () => {};

export const WebView = MockWebView; 