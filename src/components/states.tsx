/**
 * @fileoverview Loading, error and empty states
 *
 * The three states every page shows in place of its list, as on the web: a
 * column of pulsing placeholders, a bordered error panel with a retry, and a
 * dashed "nothing here" box.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Skeleton, cn, pressProps } from '@sudobility/components-rn';

/** Pulsing row placeholders shown while a list loads. */
export function ListSkeleton({
  rows,
  height,
  label,
}: {
  rows: number;
  height: number;
  /** Read out by a screen reader, e.g. "Loading members". */
  label: string;
}) {
  return (
    <View
      className='gap-3'
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={label}
    >
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          variant='rectangle'
          width='100%'
          height={height}
          className='rounded-lg'
        />
      ))}
    </View>
  );
}

/** A failed load: what failed, why, and a retry. */
export function ErrorPanel({
  title,
  message,
  retryLabel,
  onRetry,
  className,
}: {
  title: string;
  message: string;
  /** Accessible name of the retry button, e.g. "Retry loading members". */
  retryLabel: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'items-center rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
      accessibilityRole='alert'
    >
      <Text className='mb-2 text-base font-medium text-destructive'>
        {title}
      </Text>
      <Text className='mb-4 text-center text-sm text-muted-foreground'>
        {message}
      </Text>
      <Pressable
        {...pressProps(onRetry)}
        accessibilityRole='button'
        accessibilityLabel={retryLabel}
        className='rounded-lg bg-primary px-4 py-2 active:opacity-80'
      >
        <Text className='text-base font-medium text-primary-foreground'>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

/** The dashed box shown where a list would be when it has no rows. */
export function EmptyPanel({
  dashed = true,
  children,
}: {
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        'items-center px-4 py-8',
        dashed && 'rounded-lg border border-dashed border-border'
      )}
    >
      {children}
    </View>
  );
}
