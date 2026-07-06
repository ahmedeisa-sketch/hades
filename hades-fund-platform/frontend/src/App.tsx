import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InvestorsList } from './pages/investors/InvestorsList';
import { InvestorDetail } from './pages/investors/InvestorDetail';
import { InvestorNew } from './pages/investors/InvestorNew';
import { ComplianceCenter } from './pages/compliance/ComplianceCenter';
import { DistributionsList } from './pages/distributions/DistributionsList';
import { DistributionDetail } from './pages/distributions/DistributionDetail';
import { RedemptionsList } from './pages/redemptions/RedemptionsList';
import { RedemptionDetail } from './pages/redemptions/RedemptionDetail';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/investors" element={<InvestorsList />} />
                <Route path="/investors/new" element={<InvestorNew />} />
                <Route path="/investors/:id" element={<InvestorDetail />} />
                <Route path="/compliance" element={<ComplianceCenter />} />
                <Route path="/distributions" element={<DistributionsList />} />
                <Route path="/distributions/:id" element={<DistributionDetail />} />
                <Route path="/redemptions" element={<RedemptionsList />} />
                <Route path="/redemptions/:id" element={<RedemptionDetail />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
