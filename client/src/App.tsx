import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ReportPage from "./pages/ReportPage";
import RehabPlanPage from "./pages/RehabPlanPage";
import DashboardPage from "./pages/DashboardPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/report" component={ReportPage} />
      <Route path="/rehab-plan" component={RehabPlanPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <AssessmentProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AssessmentProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
