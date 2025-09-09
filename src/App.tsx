import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserManager } from "./components/UserManager";
import Index from "./pages/Index";
import PlaylistsPage from "./pages/PlaylistsPage";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignHistoryPage from "./pages/CampaignHistoryPage";
import ClientsPage from "./pages/ClientsPage";
import CampaignIntakePage from "./pages/CampaignIntakePage";
import AuthPage from "./pages/AuthPage";
import SalespersonDashboard from "./pages/SalespersonDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
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
            <Route path="/campaigns" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <CampaignHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <ClientsPage />
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
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
