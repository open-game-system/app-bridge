export const createNativeBridge = jest.fn(() => ({
  registerWebView: jest.fn(() => jest.fn()),
  onWebViewReady: jest.fn(() => jest.fn()),
  produce: jest.fn(),
  setState: jest.fn(),
  isWebViewReady: jest.fn(() => false),
  _getState: jest.fn(() => ({ counter: { value: 0 } }))
})); 