/**
 * @fileoverview Role Badge
 *
 * The pill naming a role, in the design system's badge tones the web uses:
 * owner in the warning tone, manager in the primary tone, member in the
 * neutral one.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@sudobility/design';
import { cn } from '@sudobility/components-rn';

const badge = colors.component.badge;
const roleBadgeStyles: Record<string, string> = {
  owner: `${badge.warning.base} ${badge.warning.dark}`,
  manager: `${badge.primary.base} ${badge.primary.dark}`,
  member: `${badge.default.base} ${badge.default.dark}`,
};

/**
 * A badge tone is one class string on the web, where a `<span>` takes both its
 * background and its text colour. Here the background belongs to the `View`
 * and the colour to the `Text`, so the string is split by what each class sets.
 */
export function splitBadgeClasses(classes: string): {
  box: string;
  text: string;
} {
  const tokens = classes.split(/\s+/).filter(Boolean);
  const isText = (token: string) => /^(?:[a-z-]+:)*text-/.test(token);
  return {
    box: tokens.filter(token => !isText(token)).join(' '),
    text: tokens.filter(isText).join(' '),
  };
}

export function RoleBadge({
  role,
  className,
}: {
  role: string;
  /** Extra classes for the pill, e.g. its padding. */
  className?: string;
}) {
  const tone = splitBadgeClasses(
    roleBadgeStyles[role] ?? roleBadgeStyles.member
  );
  return (
    <View className={cn('rounded-full px-2 py-0.5', tone.box, className)}>
      <Text className={cn('text-xs font-medium', tone.text)}>{role}</Text>
    </View>
  );
}
