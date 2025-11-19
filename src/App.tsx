import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import Index from "./pages/Home";
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Browse from "./pages/Browse";
import ArtworkDetail from "./pages/ArtworkDetail";
import UserProfile from "./pages/UserProfile";
import DevConsole from "./pages/DevConsole";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/browse" element={<Layout><Browse /></Layout>} />
          <Route path="/upload" element={<AuthenticatedLayout><Upload /></AuthenticatedLayout>} />
          <Route path="/profile" element={<AuthenticatedLayout><Profile /></AuthenticatedLayout>} />
          <Route path="/dev-console" element={<AuthenticatedLayout><DevConsole /></AuthenticatedLayout>} />
          <Route path="/artwork/:id" element={<Layout><ArtworkDetail /></Layout>} />
          <Route path="/user/:id" element={<Layout><UserProfile /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
