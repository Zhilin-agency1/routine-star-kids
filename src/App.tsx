import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FamilySetup } from "@/components/FamilySetup";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { StorePage } from "./pages/child/StorePage";
import { JobBoardPage } from "./pages/child/JobBoardPage";
import { SchedulePage } from "./pages/child/SchedulePage";
import { ParentDashboard } from "./pages/parent/Dashboard";
import { ChildrenPage } from "./pages/parent/ChildrenPage";
import { TasksPage } from "./pages/parent/TasksPage";
import { ParentStorePage } from "./pages/parent/ParentStorePage";
import { ParentJobBoardPage } from "./pages/parent/ParentJobBoardPage";
import { ReportsPage } from "./pages/parent/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <Index />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/store"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <StorePage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <JobBoardPage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <SchedulePage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentDashboard />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/children"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ChildrenPage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/tasks"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <TasksPage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/store"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentStorePage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/jobs"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentJobBoardPage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/reports"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ReportsPage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
