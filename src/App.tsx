import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GuidedTour } from "@/components/HelpSystem";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserManager } from "./components/UserManager";
import Index from "./pages/Index";
import PlaylistsPage from "./pages/PlaylistsPage";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignHistoryPage from "./pages/CampaignHistoryPage";
import CampaignSubmissionsPage from "./pages/CampaignSubmissionsPage";
import ClientsPage from "./pages/ClientsPage";
import CampaignIntakePage from "./pages/CampaignIntakePage";
import AuthPage from "./pages/AuthPage";
import SalespersonDashboard from "./pages/SalespersonDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import VendorPlaylistsPage from "./pages/VendorPlaylistsPage";
import VendorRequestsPage from "./pages/VendorRequestsPage";
import MLDashboardPage from "./pages/MLDashboardPage";
import CompliancePage from "./pages/CompliancePage";
import ReportsPage from "./pages/ReportsPage";
import VendorPaymentHistoryPage from "./pages/VendorPaymentHistoryPage";
import AdminPaymentHistoryPage from "./pages/AdminPaymentHistoryPage";
import TeamGoalsPage from "./pages/TeamGoalsPage";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/campaign-intake" element={<CampaignIntakePage />} />
            
            {/* Protected routes for admin/manager */}
            <Route path="/" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Layout>
                  <UserManager />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/playlists" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <PlaylistsPage />
              </ProtectedRoute>
            } />
            <Route path="/campaign/new" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CampaignBuilder />
              </ProtectedRoute>
            } />
            <Route path="/campaign-builder/review/:submissionId" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CampaignBuilder />
              </ProtectedRoute>
            } />
            <Route path="/campaign/edit/:campaignId" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CampaignBuilder />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'salesperson']}>
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute requiredRoles={['admin', 'manager', 'salesperson']}>
                <CampaignHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/submissions" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CampaignSubmissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/ml-dashboard" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <MLDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/compliance" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CompliancePage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <AdminPaymentHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/team-goals" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <TeamGoalsPage />
              </ProtectedRoute>
            } />
            
            {/* Salesperson dashboard */}
            <Route path="/salesperson" element={
              <ProtectedRoute requiredRoles={['salesperson']}>
                <SalespersonDashboard />
              </ProtectedRoute>
            } />
            
            {/* Vendor portal */}
            <Route path="/vendor" element={
              <ProtectedRoute requiredRoles={['vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/vendor/playlists" element={
              <ProtectedRoute requiredRoles={['vendor']}>
                <VendorPlaylistsPage />
              </ProtectedRoute>
            } />
            <Route path="/vendor/requests" element={
              <ProtectedRoute requiredRoles={['vendor']}>
                <VendorRequestsPage />
              </ProtectedRoute>
            } />
            <Route path="/vendor/payments" element={
              <ProtectedRoute requiredRoles={['vendor']}>
                <VendorPaymentHistoryPage />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <GuidedTour />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
