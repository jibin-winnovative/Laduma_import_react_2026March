import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, padding = 'md', className = '', ...props }: CardProps) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = ({ children, className = '', ...props }: CardHeaderProps) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = ({ children, className = '', ...props }: CardTitleProps) => (
  <h3 className={`text-xl font-semibold text-[var(--color-text)] ${className}`} {...props}>
    {children}
  </h3>
);

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = ({ children, className = '', ...props }: CardContentProps) => (
  <div className={className} {...props}>
    {children}
  </div>
);
