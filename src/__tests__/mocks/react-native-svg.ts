/**
 * Mock of react-native-svg for Vitest: an icon renders as an empty element
 * that keeps its class, which is all a test can observe of one.
 */
import React from 'react';

const Svg = ({ className }: Record<string, any>) =>
  React.createElement('i', { 'data-testid': 'Svg', className });

export const Path = () => null;

export default Svg;
