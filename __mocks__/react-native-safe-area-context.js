const React = require("react");
const { View } = require("react-native");

const insets = { top: 0, right: 0, bottom: 0, left: 0 };

module.exports = {
  useSafeAreaInsets: () => insets,
  SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
  SafeAreaView: ({ children, ...rest }) => React.createElement(View, rest, children),
  SafeAreaConsumer: ({ children }) => children(insets),
  SafeAreaInsetsContext: { Consumer: ({ children }) => children(insets) },
  initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 390, height: 844 } },
};
