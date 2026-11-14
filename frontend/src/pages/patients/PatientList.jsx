import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import {
  Search,
  Plus,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Phone,
  Calendar,
  Filter
} from 'lucide-react';

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Status toggle confirm dialog
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchPatients = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        size: 10,
        search: search.trim() || undefined,
        active: activeFilter === '' ? undefined : activeFilter === 'true'
      };
      const res = await patientService.getPatients(params);
      if (res && res.data) {
        setPatients(res.data.content);
        setPage(res.data.pageNumber);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      }
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(0);
  }, [search, activeFilter]);

  const handleToggleStatus = async () => {
    if (!selectedPatient) return;
    setActionLoading(true);
    try {
      const newStatus = !selectedPatient.active;
      await patientService.setPatientStatus(selectedPatient.id, newStatus);
      success(`Patient ${selectedPatient.fullName} ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setIsConfirmOpen(false);
      setSelectedPatient(null);
      fetchPatients(page);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500">Manage hospital registrations, patient demographics, and active statuses</p>
        </div>
        {hasRole('ADMIN', 'RECEPTIONIST') && (
          <button
            onClick={() => navigate('/patients/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Patients</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patients found"
            description="No patient records match the specified search or filter criteria."
            actionText={hasRole('ADMIN', 'RECEPTIONIST') ? 'Register New Patient' : undefined}
            onAction={hasRole('ADMIN', 'RECEPTIONIST') ? () => navigate('/patients/new') : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Patient Details</th>
                  <th className="py-3.5 px-6">Reg Number</th>
                  <th className="py-3.5 px-6">Contact Phone</th>
                  <th className="py-3.5 px-6">Emergency Contact</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{p.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {p.gender} • {p.age} yrs • Blood: <span className="font-semibold">{p.bloodGroup || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-teal-700">
                      {p.registrationNumber}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {p.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div>{p.emergencyContactName}</div>
                      <div className="text-slate-400">{p.emergencyContactPhone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={p.active ? 'ACTIVE' : 'INACTIVE'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/patients/${p.id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole('ADMIN', 'RECEPTIONIST') && (
                          <button
                            onClick={() => navigate(`/patients/${p.id}/edit`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasRole('ADMIN', 'RECEPTIONIST') && (
                          <button
                            onClick={() => {
                              setSelectedPatient(p);
                              setIsConfirmOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              p.active
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.active ? 'Deactivate Patient' : 'Activate Patient'}
                          >
                            {p.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={(newPage) => fetchPatients(newPage)}
        />
      </div>

      {/* Confirm Deactivation / Activation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedPatient(null);
        }}
        onConfirm={handleToggleStatus}
        title={selectedPatient?.active ? 'Deactivate Patient' : 'Activate Patient'}
        message={
          selectedPatient?.active
            ? `Are you sure you want to deactivate patient "${selectedPatient?.fullName}" (${selectedPatient?.registrationNumber})? Inactive patients cannot book new appointments.`
            : `Are you sure you want to reactivate patient "${selectedPatient?.fullName}"?`
        }
        confirmText={selectedPatient?.active ? 'Deactivate' : 'Activate'}
        danger={selectedPatient?.active}
        loading={actionLoading}
      />
    </div>
  );
};
