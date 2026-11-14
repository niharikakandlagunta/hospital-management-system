import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PatientList } from './pages/patients/PatientList';
import { AddEditPatient } from './pages/patients/AddEditPatient';
import { PatientDetails } from './pages/patients/PatientDetails';
import { DoctorList } from './pages/doctors/DoctorList';
import { AddDoctor } from './pages/doctors/AddDoctor';
import { DoctorDetails } from './pages/doctors/DoctorDetails';
import { AppointmentList } from './pages/appointments/AppointmentList';
import { BookAppointment } from './pages/appointments/BookAppointment';
import { AppointmentDetails } from './pages/appointments/AppointmentDetails';
import { MedicalRecordList } from './pages/medical-records/MedicalRecordList';
import { CreateMedicalRecord } from './pages/medical-records/CreateMedicalRecord';
import { MedicalRecordDetails } from './pages/medical-records/MedicalRecordDetails';
import { BillingDashboard } from './pages/billing/BillingDashboard';
import { BillDetails } from './pages/billing/BillDetails';
import { PaymentHistory } from './pages/billing/PaymentHistory';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { AccessDenied } from './pages/error/AccessDenied';
import { NotFound } from './pages/error/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login initialTab="register" />} />
            </Route>

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Home redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard - Accessible to all logged-in roles */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Patients Module */}
              <Route path="/patients" element={<PatientList />} />
              <Route
                path="/patients/new"
                element={
                  <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                    <AddEditPatient />
                  </ProtectedRoute>
                }
              />
              <Route path="/patients/:id" element={<PatientDetails />} />
              <Route
                path="/patients/:id/edit"
                element={
                  <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                    <AddEditPatient />
                  </ProtectedRoute>
                }
              />

              {/* Doctors Module */}
              <Route path="/doctors" element={<DoctorList />} />
              <Route
                path="/doctors/new"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AddDoctor />
                  </ProtectedRoute>
                }
              />
              <Route path="/doctors/:id" element={<DoctorDetails />} />

              {/* Appointments Module */}
              <Route path="/appointments" element={<AppointmentList />} />
              <Route
                path="/appointments/new"
                element={
                  <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments/book"
                element={
                  <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />

              {/* Medical Records Module - Clinical Staff only */}
              <Route
                path="/medical-records"
                element={
                  <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                    <MedicalRecordList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-records/new"
                element={
                  <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                    <CreateMedicalRecord />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-records/:id"
                element={
                  <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                    <MedicalRecordDetails />
                  </ProtectedRoute>
                }
              />

              {/* Billing & Payments Module */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute roles={['ADMIN', 'BILLING_STAFF', 'RECEPTIONIST']}>
                    <BillingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/payments"
                element={
                  <ProtectedRoute roles={['ADMIN', 'BILLING_STAFF']}>
                    <PaymentHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/:id"
                element={
                  <ProtectedRoute roles={['ADMIN', 'BILLING_STAFF', 'RECEPTIONIST']}>
                    <BillDetails />
                  </ProtectedRoute>
                }
              />

              {/* Reports & Analytics */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={['ADMIN', 'BILLING_STAFF']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* User Management & Audit - Admin Only */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Access Denied inside layout */}
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Catch-all unmatched routes */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
