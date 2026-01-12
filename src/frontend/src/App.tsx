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
import { RuleEngineList, RuleEngineEditor, RuleEngineDetail } from '@/features/rule-engine';
import { DeviceProfilesList, DeviceProfileDetail, DeviceProfileForm } from '@/features/device-profiles';
import { AssetTemplatesList, AssetTemplateDetail, AssetTemplateForm } from '@/features/asset-templates';
import { AssetTypesList, AssetTypeDetail, AssetTypeForm } from '@/features/asset-types';
import { ConnectivityProfilesList, ConnectivityProfileDetail, ConnectivityProfileForm } from '@/features/connectivity-profiles';
import { DeviceBindingsList, DeviceBindingDetail, DeviceBindingForm } from '@/features/device-bindings';
import { MagnitudeCategoryList, MagnitudeCategoryForm } from '@/features/magnitude-categories';
import { MagnitudeList, MagnitudeForm } from '@/features/magnitudes';
import { UnitList, UnitForm } from '@/features/units';
import { 
  CtDashboard,
  CtUnitsList, CtUnitDetail, CtUnitForm,
  CtReelsList, CtReelDetail, CtReelForm,
  CtJobsList, CtJobDetail, CtJobForm, CtJobMonitor
} from '@/features/coiled-tubing/pages';
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
            <Route path="/rule-engine" element={<RuleEngineList />} />
            <Route path="/rule-engine/new" element={<RuleEngineEditor />} />
            <Route path="/rule-engine/:id" element={<RuleEngineDetail />} />
            <Route path="/rule-engine/:id/edit" element={<RuleEngineEditor />} />
            <Route path="/device-profiles" element={<DeviceProfilesList />} />
            <Route path="/device-profiles/new" element={<DeviceProfileForm />} />
            <Route path="/device-profiles/:id" element={<DeviceProfileDetail />} />
            <Route path="/device-profiles/:id/edit" element={<DeviceProfileForm />} />
            <Route path="/asset-templates" element={<AssetTemplatesList />} />
            <Route path="/asset-templates/new" element={<AssetTemplateForm />} />
            <Route path="/asset-templates/:id" element={<AssetTemplateDetail />} />
            <Route path="/asset-templates/:id/edit" element={<AssetTemplateForm />} />
            <Route path="/asset-types" element={<AssetTypesList />} />
            <Route path="/asset-types/new" element={<AssetTypeForm />} />
            <Route path="/asset-types/:id" element={<AssetTypeDetail />} />
            <Route path="/asset-types/:id/edit" element={<AssetTypeForm />} />
            <Route path="/connectivity-profiles" element={<ConnectivityProfilesList />} />
            <Route path="/connectivity-profiles/new" element={<ConnectivityProfileForm />} />
            <Route path="/connectivity-profiles/:id" element={<ConnectivityProfileDetail />} />
            <Route path="/connectivity-profiles/:id/edit" element={<ConnectivityProfileForm />} />
            <Route path="/device-bindings" element={<DeviceBindingsList />} />
            <Route path="/device-bindings/new" element={<DeviceBindingForm />} />
            <Route path="/device-bindings/:id" element={<DeviceBindingDetail />} />
            <Route path="/device-bindings/:id/edit" element={<DeviceBindingForm />} />
            <Route path="/magnitude-categories" element={<MagnitudeCategoryList />} />
            <Route path="/magnitude-categories/new" element={<MagnitudeCategoryForm />} />
            <Route path="/magnitude-categories/:id/edit" element={<MagnitudeCategoryForm />} />
            <Route path="/magnitudes" element={<MagnitudeList />} />
            <Route path="/magnitudes/new" element={<MagnitudeForm />} />
            <Route path="/magnitudes/:id/edit" element={<MagnitudeForm />} />
            <Route path="/units" element={<UnitList />} />
            <Route path="/units/new" element={<UnitForm />} />
            <Route path="/units/:id/edit" element={<UnitForm />} />
            
            {/* Coiled Tubing Module */}
            <Route path="/coiled-tubing" element={<CtDashboard />} />
            <Route path="/coiled-tubing/units" element={<CtUnitsList />} />
            <Route path="/coiled-tubing/units/new" element={<CtUnitForm />} />
            <Route path="/coiled-tubing/units/:id" element={<CtUnitDetail />} />
            <Route path="/coiled-tubing/units/:id/edit" element={<CtUnitForm />} />
            <Route path="/coiled-tubing/reels" element={<CtReelsList />} />
            <Route path="/coiled-tubing/reels/new" element={<CtReelForm />} />
            <Route path="/coiled-tubing/reels/:id" element={<CtReelDetail />} />
            <Route path="/coiled-tubing/reels/:id/edit" element={<CtReelForm />} />
            <Route path="/coiled-tubing/jobs" element={<CtJobsList />} />
            <Route path="/coiled-tubing/jobs/new" element={<CtJobForm />} />
            <Route path="/coiled-tubing/jobs/:id" element={<CtJobDetail />} />
            <Route path="/coiled-tubing/jobs/:id/edit" element={<CtJobForm />} />
            <Route path="/coiled-tubing/jobs/:id/monitor" element={<CtJobMonitor />} />
            
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
