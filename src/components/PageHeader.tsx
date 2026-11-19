/**
 * @fileoverview Page Header
 *
 * The bar every page opens with — the web's `ContentLayout` header: a title, a
 * one-line subtitle, an optional action on the trailing edge, and optionally a
 * panel that extends the bar downwards (the "Invite Member" form).
 */
import React from 'react';
import { View, Text } from 'react-native';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Trailing control, e.g. the "New Organization" button. */
  action?: React.ReactNode;
  /** Rendered under the title bar, inside the header. */
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  action,
  children,
}: PageHeaderProps) {
  return (
    <View className='border-b border-border bg-background'>
      <View className='flex-row items-center justify-between gap-3 px-4 py-3'>
        <View className='min-w-0 flex-1'>
          <Text
            className='text-xl font-bold text-foreground'
            accessibilityRole='header'
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className='text-sm text-muted-foreground' numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
