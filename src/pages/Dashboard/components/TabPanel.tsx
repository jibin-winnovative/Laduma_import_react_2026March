import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}

export const TabPanel = ({ tabs, activeTab, onTabChange, children }: TabPanelProps) => (
  <div>
    <div className="flex border-b border-[var(--color-border)] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-gray-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
    <div className="pt-4">{children}</div>
  </div>
);
