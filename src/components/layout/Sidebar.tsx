import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  BarChart2,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path?: string;
  icon: typeof LayoutDashboard;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
  {
    label: 'Reports',
    icon: BarChart2,
    children: [
      { label: 'PO Reports', path: '/reports/purchase-orders', icon: FileText },
      { label: 'PO Payments Report', path: '/reports/po-payments', icon: Receipt },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// ── Portal-based flyout for collapsed parent items ──
interface FlyoutMenuProps {
  item: MenuItem;
  anchorEl: HTMLElement;
  onClose: () => void;
}

const FlyoutMenu = ({ item, anchorEl, onClose }: FlyoutMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rect = anchorEl.getBoundingClientRect();

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [anchorEl, onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: rect.top, left: rect.right + 4, zIndex: 99999 }}
      className="bg-[var(--color-primary)] rounded-r-lg shadow-2xl overflow-hidden min-w-[210px]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 border-b border-white/10">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{item.label}</span>
      </div>
      {item.children!.map((child) => {
        const ChildIcon = child.icon;
        return (
          <NavLink
            key={child.path}
            to={child.path!}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-secondary)] text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
              }`
            }
          >
            <ChildIcon className="w-4 h-4 flex-shrink-0" />
            <span>{child.label}</span>
          </NavLink>
        );
      })}
    </div>,
    document.body
  );
};

// ── Portal-based tooltip for collapsed leaf items ──
interface TooltipPortalProps {
  label: string;
  anchorEl: HTMLElement;
}

const TooltipPortal = ({ label, anchorEl }: TooltipPortalProps) => {
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.top + rect.height / 2;
  const left = rect.right + 8;

  return createPortal(
    <div
      style={{ position: 'fixed', top, left, transform: 'translateY(-50%)', zIndex: 99999, pointerEvents: 'none' }}
      className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap"
    >
      {label}
    </div>,
    document.body
  );
};

// ── Collapsed leaf item with tooltip ──
interface CollapsedLeafProps {
  item: MenuItem;
}

const CollapsedLeaf = ({ item }: CollapsedLeafProps) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NavLink
        to={item.path!}
        title={item.label}
        className={({ isActive }) =>
          `flex items-center justify-center py-3 px-4 text-sm transition-colors ${
            isActive
              ? 'bg-[var(--color-secondary)] text-[var(--color-primary)] font-medium'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
          }`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
      </NavLink>
      {hovered && ref.current && <TooltipPortal label={item.label} anchorEl={ref.current} />}
    </div>
  );
};

// ── Collapsed parent item with flyout ──
interface CollapsedParentProps {
  item: MenuItem;
  isChildActive: boolean;
}

const CollapsedParent = ({ item, isChildActive }: CollapsedParentProps) => {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const location = useLocation();

  useEffect(() => {
    setFlyoutOpen(false);
  }, [location.pathname]);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={() => setFlyoutOpen((v) => !v)}
        title={item.label}
        className={`w-full flex items-center justify-center py-3 px-4 text-sm transition-colors ${
          isChildActive || flyoutOpen
            ? 'bg-[var(--color-primary-light)] text-white'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
      </button>
      {flyoutOpen && ref.current && (
        <FlyoutMenu item={item} anchorEl={ref.current} onClose={() => setFlyoutOpen(false)} />
      )}
      {hovered && !flyoutOpen && ref.current && (
        <TooltipPortal label={item.label} anchorEl={ref.current} />
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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (collapsed) setExpandedItems([]);
  }, [collapsed]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
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

    if (collapsed) {
      if (item.children) {
        return <CollapsedParent key={item.label} item={item} isChildActive={childActive} />;
      }
      return <CollapsedLeaf key={item.label} item={item} />;
    }

    // ── Expanded mode ──
    if (item.children) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
              childActive
                ? 'text-white bg-[var(--color-primary-light)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="bg-[var(--color-primary-dark)]">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.path!}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
            level > 0 ? 'pl-12' : ''
          } ${
            isActive
              ? 'bg-[var(--color-secondary)] text-[var(--color-primary)] font-medium'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white'
          }`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`h-screen bg-[var(--color-primary)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Header */}
        <div
          className={`border-b border-[var(--color-primary-light)] flex items-center flex-shrink-0 transition-all duration-300 ${
            collapsed ? 'px-0 py-4 justify-center' : 'px-4 py-5 justify-between'
          }`}
        >
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-xl font-bold text-white leading-tight whitespace-nowrap">Import Manager</h1>
              <p className="text-xs text-[var(--color-secondary)] mt-0.5 whitespace-nowrap">Laduma Hardware</p>
            </div>
          )}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-1 flex-shrink-0'}`}>
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-[var(--color-primary-light)] transition-colors"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-[var(--color-primary-light)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </aside>
    </>
  );
};
