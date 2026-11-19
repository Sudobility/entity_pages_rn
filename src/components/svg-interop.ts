/**
 * Lets an `<Svg>` drawn by this package take its colour from a class.
 *
 * Registered once, as a side effect of importing this module: NativeWind then
 * maps the colour a `className` resolves to onto the `Svg`'s `color` prop, and
 * paths drawn with `stroke='currentColor'` take it. So
 * `<Svg className='text-muted-foreground'>` follows the host's theme with no
 * hook. Same registration `@sudobility/components-rn` makes; `cssInterop` keys
 * it by component, so a second identical one simply replaces the first.
 */
import Svg from 'react-native-svg';
import { cssInterop } from 'nativewind';

if (typeof cssInterop === 'function') {
  cssInterop(Svg, {
    className: { target: 'style', nativeStyleToProp: { color: true } },
  });
}

export {};
