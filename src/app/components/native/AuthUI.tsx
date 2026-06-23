import React from 'react';
import {
  Image,
  Pressable,
  PressableProps,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { Activity, Dumbbell, LucideIcon } from 'lucide-react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AuthRole = 'trainer' | 'student';

type RoleOption = {
  icon: LucideIcon;
  label: string;
  value: AuthRole;
};

const roleOptions: RoleOption[] = [
  { value: 'trainer', label: 'Personal', icon: Activity },
  { value: 'student', label: 'Aluno', icon: Dumbbell },
];

type BoxProps = ViewProps & {
  className?: string;
};

export function AuthContent({ className, ...props }: BoxProps) {
  return <View className={cn('w-full max-w-sm self-center gap-10', className)} {...props} />;
}

export function AuthBrand() {
  return (
    <View className="items-center gap-4">
      <View
        className="h-16 w-16 items-center justify-center rounded-2xl bg-lime-400"
        style={{
          shadowColor: '#a3e635',
          shadowOpacity: 0.3,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        }}
      >
        <Activity size={32} stroke="#09090b" />
      </View>

      <View className="items-center">
        <Text className="text-3xl font-bold text-zinc-100">iPersonal</Text>
        <Text className="mt-2 text-base text-zinc-400">Sua plataforma de gestão fitness</Text>
      </View>
    </View>
  );
}

type RoleTabsProps = {
  value: AuthRole;
  onChange: (value: AuthRole) => void;
};

export function RoleTabs({ value, onChange }: RoleTabsProps) {
  return (
    <View className="flex-row rounded-2xl bg-zinc-900 p-1">
      {roleOptions.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl',
              selected ? 'bg-zinc-800' : 'bg-transparent',
            )}
          >
            <Icon size={16} stroke={selected ? '#ffffff' : '#71717a'} />
            <Text className={cn('text-sm font-medium', selected ? 'text-white' : 'text-zinc-500')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  action?: React.ReactNode;
};

export function AuthField({ action, className, label, placeholderTextColor = '#71717a', ...props }: FieldProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-zinc-300">{label}</Text>
        {action}
      </View>

      <TextInput
        className={cn(
          'h-14 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100',
          className,
        )}
        placeholderTextColor={placeholderTextColor}
        selectionColor="#a3e635"
        {...props}
      />
    </View>
  );
}

type TextLinkProps = PressableProps & {
  children: React.ReactNode;
  className?: string;
};

export function TextLink({ children, className, ...props }: TextLinkProps) {
  return (
    <Pressable {...props}>
      <Text className={cn('text-xs font-medium text-lime-400', className)}>{children}</Text>
    </Pressable>
  );
}

type GlowingButtonProps = PressableProps & {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  variant?: 'primary' | 'dark';
};

export function GlowingButton({
  children,
  className,
  disabled,
  textClassName,
  variant = 'primary',
  ...props
}: GlowingButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'h-14 w-full items-center justify-center rounded-2xl px-6',
        isPrimary ? 'bg-lime-400' : 'border border-zinc-800 bg-zinc-900',
        disabled && 'opacity-50',
        className,
      )}
      style={({ pressed }) => [
        isPrimary
          ? {
              shadowColor: '#a3e635',
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
              elevation: 8,
            }
          : null,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      {...props}
    >
      <Text className={cn('text-center font-bold', isPrimary ? 'text-zinc-950' : 'text-white', textClassName)}>
        {children}
      </Text>
    </Pressable>
  );
}

type AvatarProps = {
  className?: string;
  source: string;
};

export function Avatar({ className, source }: AvatarProps) {
  return <Image className={cn('h-12 w-12 rounded-full border-2 border-zinc-800 bg-zinc-800', className)} source={{ uri: source }} />;
}
