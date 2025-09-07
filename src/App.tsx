import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/ui/auth-provider";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import Sales from "./pages/admin/Sales";
import AdminProducts from "./pages/admin/Products";
import AdminPromotions from "./pages/admin/Promotions";
import AdminMaterials from "./pages/admin/Materials";
import AdminUsers from "./pages/admin/Users";
import AdminCompany from "./pages/admin/Company";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="croche-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/produto/:slug" element={<ProductDetail />} />
            
            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Admin Route Redirect */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireAdmin>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/vendas" element={
              <ProtectedRoute requireAdmin>
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="/admin/produtos" element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/promocoes" element={
              <ProtectedRoute requireAdmin>
                <AdminPromotions />
              </ProtectedRoute>
            } />
            <Route path="/admin/materiais" element={
              <ProtectedRoute requireAdmin>
                <AdminMaterials />
              </ProtectedRoute>
            } />
            <Route path="/admin/empresa" element={
              <ProtectedRoute requireAdmin>
                <AdminCompany />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            } />
            {/* Redirect old routes */}
            <Route path="/admin/fundadoras" element={<Navigate to="/admin/empresa" replace />} />
            <Route path="/admin/configuracoes" element={<Navigate to="/admin/empresa" replace />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
