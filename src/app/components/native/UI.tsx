import React from 'react';
import {
  Image,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { cn } from './AuthUI';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        'rounded-3xl bg-zinc-900 border border-zinc-800 p-6 overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

export type InputProps = TextInputProps & {
  className?: string;
};

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor = '#71717a', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        selectionColor="#a3e635"
        className={cn(
          'h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 focus:border-lime-400',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export function Label({ className, children, ...props }: ViewProps & { className?: string; children: React.ReactNode }) {
  return (
    <Text
      className={cn(
        'text-sm font-medium text-zinc-300 leading-none',
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
}: {
  src: string;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <Image
      source={{ uri: src }}
      className={cn(
        'rounded-full bg-zinc-800 border-2 border-zinc-800',
        sizeClasses[size],
        className
      )}
      accessibilityLabel={alt}
    />
  );
}
