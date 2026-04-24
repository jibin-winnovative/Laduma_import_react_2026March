import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Ship,
  Truck,
  FileText,
  Anchor,
  Shield,
  ChevronDown,
  ChevronRight,
  X,
  MessageSquare,
  Package,
  Briefcase,
  Tags,
  Box,
  ShoppingCart,
  Paperclip,
  Navigation,
  DollarSign,
  Receipt,
  Container,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path?: string;
  icon: typeof LayoutDashboard;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Masters',
    icon: FileText,
    children: [
      { label: 'Employees', path: '/masters/employees', icon: Users },
      { label: 'Roles', path: '/masters/roles', icon: Shield },
      { label: 'Companies', path: '/masters/companies', icon: Building2 },
      { label: 'Shipping Companies', path: '/masters/shipping-companies', icon: Ship },
      { label: 'Clearing Agents', path: '/masters/clearing-agents', icon: FileText },
      { label: 'Ocean Freight', path: '/masters/ocean-freight', icon: Ship },
      { label: 'Local Transport', path: '/masters/local-transport', icon: Truck },
      { label: 'Social Media Groups', path: '/masters/social-media-groups', icon: MessageSquare },
      { label: 'Suppliers', path: '/masters/suppliers', icon: Package },
      { label: 'Import Documents', path: '/masters/import-docs', icon: FileText },
      { label: 'Ports', path: '/masters/ports', icon: Anchor },
      { label: 'Departments', path: '/masters/departments', icon: Briefcase },
      { label: 'Categories', path: '/masters/categories', icon: Tags },
      { label: 'Product Types', path: '/masters/producttypes', icon: Box },
      { label: 'Sub Types', path: '/masters/subtypes', icon: Package },
      { label: 'Products', path: '/masters/products', icon: Package },
      { label: 'Shipment Types', path: '/masters/shipment-types', icon: Navigation },
      { label: 'Currencies', path: '/masters/currencies', icon: DollarSign },
      { label: 'Addon Charges', path: '/masters/addon-charges', icon: Receipt },
      { label: 'Clearing Payment Charges', path: '/masters/clearing-payment-charges', icon: Receipt },
      { label: 'Banks', path: '/masters/banks', icon: Landmark },
      { label: 'Attachment Types', path: '/masters/attachment-types', icon: Paperclip },
    ],
  },
  {
    label: 'Purchase',
    icon: ShoppingCart,
    children: [
      { label: 'Purchase Order', path: '/purchase/purchase-orders', icon: FileText },
      { label: 'PO Payments', path: '/purchase/po-payments', icon: DollarSign },
    ],
  },
  {
    label: 'Payments',
    icon: DollarSign,
    children: [
      { label: 'Accounts Payable', path: '/payments/accounts-payable', icon: Receipt },
    ],
  },
  {
    label: 'Shipment',
    icon: Ship,
    children: [
      { label: 'Container Management', path: '/containers', icon: Container },
      { label: 'Clearing Payment', path: '/clearing-payments', icon: Receipt },
      { label: 'Ocean Freight Payment', path: '/ocean-freight-payments', icon: Ship },
      { label: 'Local Payment', path: '/local-payments', icon: Truck },
      { label: 'ETA Payment Status', path: '/eta-payment-status', icon: FileText },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const Tooltip = ({ label, children, disabled }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (disabled) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[9999] pointer-events-none">
          <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-collapse open submenus when sidebar collapses
  useEffect(() => {
    if (collapsed) setExpandedItems([]);
  }, [collapsed]);

  const toggleExpand = (label: string) => {
    if (collapsed) return;
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isChildActive = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child) => child.path && location.pathname.startsWith(child.path)
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.label);
    const Icon = item.icon;
    const childActive = isChildActive(item);

    if (item.children) {
      return (
        <div key={item.label}>
          <Tooltip label={item.label} disabled={!collapsed}>
            <button
              onClick={() => toggleExpand(item.label)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors ${
                collapsed ? 'justify-center' : 'justify-between'
              } ${
                childActive
                  ? 'text-white bg-[var(--color-primary-light)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="transition-opacity duration-200">{item.label}</span>}
              </div>
              {!collapsed && (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )
              )}
            </button>
          </Tooltip>
          {!collapsed && isExpanded && (
            <div className="bg-[var(--color-primary-dark)]">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Tooltip key={item.label} label={item.label} disabled={!collapsed}>
        <NavLink
          to={item.path!}
          className={({ isActive }) =>
            `flex items-center py-3 text-sm transition-colors ${
              collapsed ? 'justify-center px-4' : `gap-3 px-4 ${level > 0 ? 'pl-12' : ''}`
            } ${
              isActive
                ? 'bg-[var(--color-secondary)] text-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
            }`
          }
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="transition-opacity duration-200">{item.label}</span>}
        </NavLink>
      </Tooltip>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`h-screen bg-[var(--color-primary)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Header */}
        <div className={`border-b border-[var(--color-primary-light)] flex items-center transition-all duration-300 ${
          collapsed ? 'px-0 py-4 justify-center' : 'px-4 py-5 justify-between'
        }`}>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-xl font-bold text-white leading-tight whitespace-nowrap">Import Manager</h1>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5 whitespace-nowrap">Laduma Hardware</p>
            </div>
          )}

          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-1 flex-shrink-0'}`}>
            {/* Collapse toggle — desktop only */}
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-[var(--color-primary-light)] transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-[var(--color-primary-light)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  );
};
