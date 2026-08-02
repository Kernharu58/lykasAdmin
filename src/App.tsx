import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ManagePets from "./pages/ManagePets";
import Shifts from "./pages/Shifts";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Donations from "./pages/Donations";
import Adoptions from "./pages/Adoptions";
import Interviews from "./pages/Interviews";
import HomeVisits from "./pages/HomeVisits";
import Accounts from "./pages/Accounts";
import AuditLogs from "./pages/AuditLogs";
import Events from "./pages/Events";
import Fosters from "./pages/Fosters";
import Adopters from "./pages/Adopters";
import Health from "./pages/Health";
import Reports from "./pages/Reports";
import Monitoring from "./pages/Monitoring";
// ── New pages ──────────────────────────────────────────────────────────────────
import NotificationsAdmin from "./pages/NotificationsAdmin";
import StaffManagement from "./pages/StaffManagement";
import Volunteer from "./pages/Volunteer";
import PetGallery from "./pages/PetGallery";
import PetDetails from "./pages/PetDetails";
// ── Previously built but never routed — see Phase 2 fix notes ──────────────────
import PaymentsAdmin from "./pages/PaymentsAdmin";
import GoodsDonations from "./pages/GoodsDonations";
import ContentManagement from "./pages/ContentManagement";
import FeedbackReviews from "./pages/FeedbackReviews";
import RiskAssessments from "./pages/RiskAssessments";
import UserVerification from "./pages/UserVerification";
import ShelterManagement from "./pages/ShelterManagement";
import EmergencyReports from "./pages/EmergencyReports";
import DocumentReview from "./pages/DocumentReview";
import AdoptionScheduling from "./pages/AdoptionScheduling";
import Analytics from "./pages/Analytics";
// ── Newly built out (were 0-line stubs) ─────────────────────────────────────────
import PetManagement from "./pages/PetManagement";
import AdoptionForm from "./pages/AdoptionForm";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-72 w-full min-w-0 transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto w-full">
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-bold text-amber-900 sm:hidden">
            Admin workflows are optimized for desktop; mobile access is best for
            quick review.
          </div>

          <Routes>
            {/* ── Public admin routes (all authenticated staff) ─────────────── */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/pets" element={<ManagePets />} />
            <Route path="/pets/:id" element={<PetDetails />} />
            <Route
              path="/pet-management"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <PetManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/gallery" element={<PetGallery />} />
            <Route path="/events" element={<Events />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />

            {/* ── Admin+ only ───────────────────────────────────────────────── */}
            <Route
              path="/adoptions"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Adoptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adoptions/new"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdoptionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adoptions/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <AdoptionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adoption-scheduling"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <AdoptionScheduling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-assessments"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <RiskAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/document-review"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <DocumentReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <EmergencyReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <Interviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home-visits"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "super_admin"]}>
                  <HomeVisits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fosters"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Fosters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adopters"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Adopters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Donations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <PaymentsAdmin />
                </ProtectedRoute>
              }
            />
            {/* Was already linked from the sidebar (/goods-donations) but had
                no matching route — every click silently redirected to "/". */}
            <Route
              path="/goods-donations"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <GoodsDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* ── Staff + Admin ────────────────────────────────────────────── */}
            <Route
              path="/shifts"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "staff", "super_admin"]}
                >
                  <Shifts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "staff", "super_admin"]}
                >
                  <Volunteer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "staff", "super_admin"]}
                >
                  <Health />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "staff", "super_admin"]}
                >
                  <Monitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "staff", "super_admin"]}
                >
                  <FeedbackReviews />
                </ProtectedRoute>
              }
            />

            {/* ── Notifications (admin+) ───────────────────────────────────── */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <NotificationsAdmin />
                </ProtectedRoute>
              }
            />

            {/* ── Super admin / admin ──────────────────────────────────────── */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <ContentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-verification"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <UserVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shelters"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <ShelterManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <Accounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "staff", "super_admin"]}
                    >
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
