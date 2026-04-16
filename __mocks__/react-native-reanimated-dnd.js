/**
 * Manual Jest mock for react-native-reanimated-dnd.
 * The real library uses react-native-worklets which initializes native modules
 * that are not available in the Jest environment. This mock provides
 * lightweight React implementations that satisfy the component interface
 * without touching any native code.
 */
const React = require("react");
const { View } = require("react-native");

function useSortableList({ data = [], estimatedItemHeight = 60 } = {}) {
  return {
    contentHeight: data.length * estimatedItemHeight,
    getItemProps: (item) => ({
      id: item.id,
      positions: { value: {}, get: () => ({}) },
      lowerBound: { value: 0, get: () => 0 },
      autoScrollDirection: { value: "none" },
      itemsCount: data.length,
      isDynamicHeight: true,
      estimatedItemHeight,
      itemHeights: { value: {}, get: () => ({}) },
      scheduleHeightUpdate: () => {},
    }),
    dropProviderRef: { current: null },
    scrollY: { value: 0 },
    autoScroll: { value: "none" },
    scrollViewRef: { current: null },
    handleScroll: () => {},
    handleScrollEnd: () => {},
    isDynamicHeight: true,
    itemHeights: { value: {}, get: () => ({}) },
    scheduleHeightUpdate: undefined,
  };
}

function SortableItem({ children, onDrop: _onDrop, data: _data, ...rest }) {
  return React.createElement(View, rest, children);
}

const SortableHandle = ({ children, style }) =>
  React.createElement(View, { style }, children);
SortableItem.Handle = SortableHandle;

const DropProvider = React.forwardRef(function DropProvider({ children }, _ref) {
  return React.createElement(View, null, children);
});

module.exports = {
  useSortableList,
  SortableItem,
  DropProvider,
};
