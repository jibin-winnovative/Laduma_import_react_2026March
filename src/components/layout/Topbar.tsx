import { Menu } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 fixed top-0 right-0 left-0 lg:left-64 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-[var(--color-border)] rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6 text-[var(--color-text)]" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 md:gap-4">
        <UserProfileDropdown />
      </div>
    </header>
  );
};
