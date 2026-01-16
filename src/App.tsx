import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ParentOnlyRoute } from "@/components/ParentOnlyRoute";
import { FamilySetup } from "@/components/FamilySetup";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { StorePage } from "./pages/child/StorePage";
import { FamilySchedulePage } from "./pages/child/FamilySchedulePage";
import { FamilyJobBoardPage } from "./pages/child/FamilyJobBoardPage";
import { ParentDashboard } from "./pages/parent/Dashboard";
import { ChildrenPage } from "./pages/parent/ChildrenPage";
import { TasksPage } from "./pages/parent/TasksPage";
import { ParentStorePage } from "./pages/parent/ParentStorePage";
import { ParentJobBoardPage } from "./pages/parent/ParentJobBoardPage";
import { TemplatesPage } from "./pages/parent/TemplatesPage";
import { ProfilePage } from "./pages/parent/ProfilePage";
import { SecurityPrivacyPage } from "./pages/parent/SecurityPrivacyPage";
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
                <Route path="/invite/:token" element={<InviteAcceptPage />} />
                
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
                
                {/* Child Routes - Unified KIDS mode */}
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <FamilySchedulePage />
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exchange"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <FamilyJobBoardPage />
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
                
                {/* Parent Routes */}
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
                  path="/parent/templates"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentOnlyRoute>
                            <TemplatesPage />
                          </ParentOnlyRoute>
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/profile"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentOnlyRoute>
                            <ProfilePage />
                          </ParentOnlyRoute>
                        </Layout>
                      </FamilySetup>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/parent/security"
                  element={
                    <ProtectedRoute>
                      <FamilySetup>
                        <Layout>
                          <ParentOnlyRoute>
                            <SecurityPrivacyPage />
                          </ParentOnlyRoute>
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
