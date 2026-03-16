import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { LoginPage } from './pages/Auth/LoginPage';
import { ProfilePage } from './pages/Auth/ProfilePage';
import { ChangePasswordPage } from './pages/Auth/ChangePasswordPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { EmployeesPage } from './pages/Masters/EmployeesPage';
import { RolesPage } from './pages/Masters/RolesPage';
import { CompaniesPage } from './pages/Masters/CompaniesPage';
import { ShippingCompaniesPage } from './pages/Masters/ShippingCompaniesPage';
import { ClearingAgentsPage } from './pages/Masters/ClearingAgentsPage';
import { OceanFreightPage } from './pages/Masters/OceanFreightPage';
import { LocalTransportPage } from './pages/Masters/LocalTransportPage';
import { SocialMediaGroupsPage } from './pages/Masters/SocialMediaGroupsPage';
import { SuppliersPage } from './pages/Masters/SuppliersPage';
import { ImportDocsPage } from './pages/Masters/ImportDocsPage';
import { PortsPage } from './pages/Masters/PortsPage';
import { DepartmentsPage } from './pages/Masters/DepartmentsPage';
import { CategoriesPage } from './pages/Masters/CategoriesPage';
import { ProductTypesPage } from './pages/Masters/ProductTypesPage';
import { SubTypesPage } from './pages/Masters/SubTypesPage';
import { ProductMastersPage } from './pages/Masters/ProductMastersPage';
import { ShipmentTypesPage } from './pages/Masters/ShipmentTypesPage';
import { CurrencyPage } from './pages/Masters/CurrencyPage';
import { AddonChargesPage } from './pages/Masters/AddonChargesPage';
import { ClearingPaymentChargesPage } from './pages/Masters/ClearingPaymentChargesPage';
import { PurchaseOrderPage } from './pages/Purchase/PurchaseOrderPage';
import { POPaymentsPage } from './pages/Purchase/POPaymentsPage';
import AccountsPayablePage from './pages/Payments/AccountsPayablePage';
import { ContainerManagementPage } from './pages/Shipment/ContainerManagementPage';
import { ContainerForm } from './pages/Shipment/ContainerForm';
import { ViewContainerDetails } from './pages/Shipment/ViewContainerDetails';
import { ClearingPaymentPage } from './pages/Shipment/ClearingPaymentPage';
import { OceanFreightPaymentPage } from './pages/Shipment/OceanFreightPaymentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/change-password" element={<ChangePasswordPage />} />

                        <Route path="/masters/employees" element={<EmployeesPage />} />
                        <Route path="/masters/roles" element={<RolesPage />} />
                        <Route path="/masters/companies" element={<CompaniesPage />} />
                        <Route path="/masters/shipping-companies" element={<ShippingCompaniesPage />} />
                        <Route path="/masters/clearing-agents" element={<ClearingAgentsPage />} />
                        <Route path="/masters/ocean-freight" element={<OceanFreightPage />} />
                        <Route path="/masters/local-transport" element={<LocalTransportPage />} />
                        <Route path="/masters/social-media-groups" element={<SocialMediaGroupsPage />} />
                        <Route path="/masters/suppliers" element={<SuppliersPage />} />
                        <Route path="/masters/import-docs" element={<ImportDocsPage />} />
                        <Route path="/masters/ports" element={<PortsPage />} />
                        <Route path="/masters/departments" element={<DepartmentsPage />} />
                        <Route path="/masters/categories" element={<CategoriesPage />} />
                        <Route path="/masters/producttypes" element={<ProductTypesPage />} />
                        <Route path="/masters/subtypes" element={<SubTypesPage />} />
                        <Route path="/masters/products" element={<ProductMastersPage />} />
                        <Route path="/masters/shipment-types" element={<ShipmentTypesPage />} />
                        <Route path="/masters/currencies" element={<CurrencyPage />} />
                        <Route path="/masters/addon-charges" element={<AddonChargesPage />} />
                        <Route path="/masters/clearing-payment-charges" element={<ClearingPaymentChargesPage />} />

                        <Route path="/purchase/purchase-orders" element={<PurchaseOrderPage />} />
                        <Route path="/purchase/po-payments" element={<POPaymentsPage />} />

                        <Route path="/payments/accounts-payable" element={<AccountsPayablePage />} />

                        <Route path="/containers" element={<ContainerManagementPage />} />
                        <Route path="/containers/create" element={<ContainerForm />} />
                        <Route path="/containers/edit/:id" element={<ContainerForm />} />
                        <Route path="/containers/view/:id" element={<ViewContainerDetails />} />
                        <Route path="/clearing-payments" element={<ClearingPaymentPage />} />
                        <Route path="/ocean-freight-payments" element={<OceanFreightPaymentPage />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
