import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BasinsList, BasinDetail, BasinForm } from '@/features/basins';
import { FieldsList, FieldDetail } from '@/features/fields';
import { ReservoirsList, ReservoirDetail, ReservoirForm } from '@/features/reservoirs';
import { WellsList, WellDetail } from '@/features/wells';
import WellTestsPage from '@/pages/WellTestsPage';
import WellTestDetailPage from '@/pages/WellTestDetailPage';
import { DataSourcesPage, EdgeGatewaysPage } from '@/features/edge-gateway';
import { AssetsPage, AssetDetailPage, AssetFormPage, TelemetryPage, RulesPage } from '@/features/infrastructure';
import { RolesPage, PermissionsPage } from '@/features/rbac';
import { DigitalTwinsList, DigitalTwinDetail, DigitalTwinForm } from '@/features/digital-twins';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import '@/i18n';

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
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas protegidas con layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/basins" element={<BasinsList />} />
            <Route path="/basins/new" element={<BasinForm />} />
            <Route path="/basins/:id" element={<BasinDetail />} />
            <Route path="/basins/:id/edit" element={<BasinForm />} />
            <Route path="/fields" element={<FieldsList />} />
            <Route path="/fields/:id" element={<FieldDetail />} />
            <Route path="/reservoirs" element={<ReservoirsList />} />
            <Route path="/reservoirs/new" element={<ReservoirForm />} />
            <Route path="/reservoirs/:id" element={<ReservoirDetail />} />
            <Route path="/reservoirs/:id/edit" element={<ReservoirForm />} />
            <Route path="/wells" element={<WellsList />} />
            <Route path="/wells/:id" element={<WellDetail />} />
            <Route path="/well-tests" element={<WellTestsPage />} />
            <Route path="/well-tests/:testId" element={<WellTestDetailPage />} />
            <Route path="/edge/data-sources" element={<DataSourcesPage />} />
            <Route path="/edge/gateways" element={<EdgeGatewaysPage />} />
            <Route path="/digital-twins" element={<DigitalTwinsList />} />
            <Route path="/digital-twins/new" element={<DigitalTwinForm />} />
            <Route path="/digital-twins/:thingId" element={<DigitalTwinDetail />} />
            <Route path="/digital-twins/:thingId/edit" element={<DigitalTwinForm />} />
            <Route path="/infrastructure/assets" element={<AssetsPage />} />
            <Route path="/infrastructure/assets/new" element={<AssetFormPage />} />
            <Route path="/infrastructure/assets/:id" element={<AssetDetailPage />} />
            <Route path="/infrastructure/assets/:id/edit" element={<AssetFormPage />} />
            <Route path="/infrastructure/telemetry" element={<TelemetryPage />} />
            <Route path="/infrastructure/rules" element={<RulesPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/permissions" element={<PermissionsPage />} />
          </Route>

          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        duration={4000}
      />
    </QueryClientProvider>
  );
}

export default App;
