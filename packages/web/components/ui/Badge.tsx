'use client';

interface BadgeProps {
  variant?: 'default' | 'success' | 'destructive' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  destructive: 'bg-red-100 text-red-800',
  secondary: 'bg-gray-100 text-gray-700',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
