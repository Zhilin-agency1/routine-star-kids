import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import { StorePage } from "./pages/child/StorePage";
import { JobBoardPage } from "./pages/child/JobBoardPage";
import { SchedulePage } from "./pages/child/SchedulePage";
import { ParentDashboard } from "./pages/parent/Dashboard";
import { ChildrenPage } from "./pages/parent/ChildrenPage";
import { TasksPage } from "./pages/parent/TasksPage";
import { ParentStorePage } from "./pages/parent/ParentStorePage";
import { ReportsPage } from "./pages/parent/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* Child Routes */}
                <Route path="/store" element={<StorePage />} />
                <Route path="/jobs" element={<JobBoardPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                {/* Parent Routes */}
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/parent/children" element={<ChildrenPage />} />
                <Route path="/parent/tasks" element={<TasksPage />} />
                <Route path="/parent/store" element={<ParentStorePage />} />
                <Route path="/parent/reports" element={<ReportsPage />} />
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
