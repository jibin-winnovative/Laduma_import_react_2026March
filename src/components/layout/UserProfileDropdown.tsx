import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-primary)] font-semibold text-sm">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-[var(--color-text)]">{user.username}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{user.role}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-2 z-50">
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
          <button
            onClick={() => {
              navigate('/change-password');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </button>
          <div className="h-px bg-[var(--color-border)] my-2" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-background)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
