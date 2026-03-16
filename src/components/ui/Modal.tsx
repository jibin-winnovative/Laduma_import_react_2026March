import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[95vw] sm:max-w-md',
    md: 'max-w-[95vw] sm:max-w-lg',
    lg: 'max-w-[95vw] sm:max-w-2xl',
    xl: 'max-w-[95vw] sm:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-[var(--color-surface)] rounded-lg shadow-lg ${sizeClasses[size]} w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
            {title && (
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-text)] pr-8">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-[var(--color-border)] transition-colors absolute right-2 sm:right-4 top-3 sm:top-4"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            )}
          </div>
        )}
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className = '' }: ModalFooterProps) => (
  <div className={`flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--color-border)] ${className}`}>
    {children}
  </div>
);
