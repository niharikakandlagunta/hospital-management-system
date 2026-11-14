import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  History,
  Lock,
  Mail,
  User,
  Power,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { formatDate } from '../../utils/formatters';

export const UserManagementPage = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit'

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userTotalElements, setUserTotalElements] = useState(0);

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditTotalElements, setAuditTotalElements] = useState(0);

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'RECEPTIONIST'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await userService.getUsers({ page: userPage, size: 10 });
      if (res && res.data) {
        setUsers(res.data.content || []);
        setUserTotalPages(res.data.totalPages || 0);
        setUserTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      error('Failed to load user accounts: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, error]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingAudit(true);
      const res = await userService.getAuditLogs({ page: auditPage, size: 15 });
      if (res && res.data) {
        setAuditLogs(res.data.content || []);
        setAuditTotalPages(res.data.totalPages || 0);
        setAuditTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      error('Failed to load audit logs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingAudit(false);
    }
  }, [auditPage, error]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, fetchUsers, fetchAuditLogs]);

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user.id);
      success(`User ${user.username} is now ${user.active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      error('Failed to update user status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
      error('Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await userService.createUser(formData);
      success(`Staff account for ${formData.fullName} created successfully`);
      setIsCreateModalOpen(false);
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        role: 'RECEPTIONIST'
      });
      fetchUsers();
    } catch (err) {
      error('Failed to create user: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Administration & Security</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hospital staff logins, assign role-based permissions, and review system audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Accounts</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Staff Account</span>
            </button>
          )}
        </div>
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Hospital Staff Directory</h3>
              <span className="text-xs text-slate-400 font-medium">
                {userTotalElements} registered users
              </span>
            </div>

            {loadingUsers ? (
              <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
                Loading user directory...
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Users Found"
                description="No user accounts registered yet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-teal-700">
                          @{u.username}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'DOCTOR'
                                ? 'bg-blue-100 text-blue-800'
                                : u.role === 'RECEPTIONIST'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.active ? 'Deactivate user' : 'Activate user'}
                              className={`p-1.5 rounded-lg border transition ${
                                u.active
                                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {userTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={userPage}
                  totalPages={userTotalPages}
                  totalElements={userTotalElements}
                  onPageChange={setUserPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Hospital System Audit Trail</h3>
              <button
                onClick={fetchAuditLogs}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingAudit ? (
              <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
                Retrieving audit trails...
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                icon={History}
                title="No Audit Records"
                description="No system audit logs recorded yet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-800 uppercase tracking-wide">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-700">
                          {log.entityName}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          #{log.entityId}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-teal-700">
                          {log.performedBy || 'System'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-sm truncate">
                          {log.details || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {auditTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={auditPage}
                  totalPages={auditTotalPages}
                  totalElements={auditTotalElements}
                  onPageChange={setAuditPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Staff Account"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username *
              </label>
              <input
                type="text"
                placeholder="e.g. sjenkins"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                required
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Temporary Password *
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="e.g. sarah.jenkins@medicare-hms.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              required
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="RECEPTIONIST">RECEPTIONIST - Patient registration, booking, schedule management</option>
              <option value="BILLING_STAFF">BILLING_STAFF - Invoices, payment collection, financial reports</option>
              <option value="DOCTOR">DOCTOR - Clinical visits, electronic medical records, prescriptions</option>
              <option value="ADMIN">ADMIN - Full system administration, user management, audit logs</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UserManagementPage;
