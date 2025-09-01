import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlaylistsPage from "./pages/PlaylistsPage";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignHistoryPage from "./pages/CampaignHistoryPage";
import ClientsPage from "./pages/ClientsPage";
import CampaignIntakePage from "./pages/CampaignIntakePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/campaign/new" element={<CampaignBuilder />} />
          <Route path="/campaigns" element={<CampaignHistoryPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          {/* Public route for campaign intake form */}
          <Route path="/campaign-intake" element={<CampaignIntakePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
