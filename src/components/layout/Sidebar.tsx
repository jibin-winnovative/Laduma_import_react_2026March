import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
      { label: 'Supplier Coupons/Discounts', path: '/purchase/supplier-coupon-discounts', icon: Tags },
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
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.label);
    const Icon = item.icon;

    if (item.children) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
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
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </NavLink>
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
        className={`w-64 h-screen bg-[var(--color-primary)] flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-[var(--color-primary-light)] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Import Manager</h1>
            <p className="text-xs text-[var(--color-secondary)] mt-1">Laduma Hardware</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:bg-[var(--color-primary-light)] p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
      </aside>
    </>
  );
};
