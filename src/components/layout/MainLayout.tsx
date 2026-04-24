import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: ReactNode;
}

const COLLAPSED_KEY = 'sidebar-collapsed';

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main
        className={`mt-16 p-4 md:p-6 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
};
