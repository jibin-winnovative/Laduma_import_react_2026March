import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[var(--color-secondary)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
      )}
    </button>
  );
};
