import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AssessmentProvider } from "./contexts/AssessmentContext";

// English pages
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import ReportPage from "./pages/ReportPage";
import RehabPlanPage from "./pages/RehabPlanPage";
import DashboardPage from "./pages/DashboardPage";
import PatientTimelinePage from "./pages/PatientTimelinePage";
import DecisionLogPage from "./pages/DecisionLogPage";
import PatientHomePage from "./pages/PatientHomePage";
import PatientUploadPage from "./pages/PatientUploadPage";
import PatientMessagesPage from "./pages/PatientMessagesPage";

// Chinese pages
import HomeZh from "./pages/zh/HomeZh";
import LoginPageZh from "./pages/zh/LoginPageZh";
import UploadPageZh from "./pages/zh/UploadPageZh";
import ReportPageZh from "./pages/zh/ReportPageZh";
import RehabPlanPageZh from "./pages/zh/RehabPlanPageZh";
import DashboardPageZh from "./pages/zh/DashboardPageZh";

function Router() {
  return (
    <Switch>
      {/* English routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/report" component={ReportPage} />
      <Route path="/rehab-plan" component={RehabPlanPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/patient/:id" component={PatientTimelinePage} />
      <Route path="/decision-log" component={DecisionLogPage} />

      {/* Patient workspace routes */}
      <Route path="/patient-home" component={PatientHomePage} />
      <Route path="/patient-upload" component={PatientUploadPage} />
      <Route path="/patient-messages" component={PatientMessagesPage} />

      {/* Chinese routes */}
      <Route path="/zh" component={HomeZh} />
      <Route path="/zh/login" component={LoginPageZh} />
      <Route path="/zh/upload" component={UploadPageZh} />
      <Route path="/zh/report" component={ReportPageZh} />
      <Route path="/zh/rehab-plan" component={RehabPlanPageZh} />
      <Route path="/zh/dashboard" component={DashboardPageZh} />

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
