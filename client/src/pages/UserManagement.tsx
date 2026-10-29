import { useState, useEffect, useRef } from 'react'
import { fetchAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword } from '../api'
import type { AdminUser } from '../api'
import { useAuth } from '../context/AuthContext'
import Dialog from '../components/Dialog'

export default function UserManagement() {
    const { user } = useAuth()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE')
    const [editingUserId, setEditingUserId] = useState<number | null>(null)
    const [formData, setFormData] = useState({ name: '', email: '', role: 'REQUESTER', isActive: true, initialPassword: '' })
    const [modalError, setModalError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [passwordResetMsg, setPasswordResetMsg] = useState<string | null>(null)

    const [revision, setRevision] = useState(0)
    const saveLock = useRef(false)
    const initialForm = useRef(formData)
    const allowed = user?.role === 'ADMIN'
    useEffect(() => {
        if (!allowed) return
        let live = true; setLoading(true); setError(null)
        fetchAdminUsers(search, roleFilter).then(data => { if (live) setUsers(data) })
            .catch(() => { if (live) setError('Unable to load users. Please retry.') })
            .finally(() => { if (live) setLoading(false) })
        return () => { live = false }
    }, [allowed, search, roleFilter, revision])
    function closeModal() {
        if (saveLock.current) return
        if (JSON.stringify(formData) !== JSON.stringify(initialForm.current) && !window.confirm('Discard this unsaved user draft?')) return
        setShowModal(false)
    }
    const saveMessage = (error: unknown) => {
        // Allow only known field/domain feedback; never display arbitrary server text.
        const message = error instanceof Error ? error.message : ''
        return /^(Email already exists|Cannot deactivate|Cannot demote|Cannot change|Cannot remove|Password must|Initial password is required|Invalid email|Name is required|Please enter a new password)/i.test(message)
            ? message : 'Unable to save user. Your fields have been kept. Check the user list before retrying if the response was lost.'
    }

    function openCreateModal() {
        setModalMode('CREATE')
        setFormData({ name: '', email: '', role: 'REQUESTER', isActive: true, initialPassword: '' })
        setModalError(null)
        setPasswordResetMsg(null)
        initialForm.current = { name: '', email: '', role: 'REQUESTER', isActive: true, initialPassword: '' }
        setShowModal(true)
    }

    function openEditModal(u: AdminUser) {
        setModalMode('EDIT')
        setEditingUserId(u.id)
        setFormData({ name: u.name, email: u.email, role: u.role, isActive: u.isActive, initialPassword: '' })
        initialForm.current = { name: u.name, email: u.email, role: u.role, isActive: u.isActive, initialPassword: '' }
        setModalError(null)
        setPasswordResetMsg(null)
        setShowModal(true)
    }

    async function handleSave() {
        if (saveLock.current) return
        saveLock.current = true; setSaving(true)
        setModalError(null)
        setPasswordResetMsg(null)
        try {
            if (modalMode === 'CREATE') {
                if (!formData.initialPassword) throw new Error('Initial password is required for new users.')
                await createAdminUser(formData)
            } else {
                if (editingUserId === null) return
                await updateAdminUser(editingUserId, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    isActive: formData.isActive
                })
            }
            setShowModal(false)
            setRevision(n => n + 1)
        } catch (e: any) {
            setModalError(saveMessage(e))
        } finally {
            saveLock.current = false; setSaving(false)
        }
    }

    async function handleResetPassword() {
        if (!editingUserId || !formData.initialPassword) {
            setModalError('Please enter a new password to reset.')
            return
        }
        if (saveLock.current) return
        saveLock.current = true; setSaving(true)
        setModalError(null)
        setPasswordResetMsg(null)
        try {
            await resetAdminUserPassword(editingUserId, formData.initialPassword)
            setPasswordResetMsg('Password reset successfully. The user will be forced to change it on next login.')
            setFormData({ ...formData, initialPassword: '' })
            setRevision(n => n + 1)
        } catch (e: any) {
            setModalError(saveMessage(e))
        } finally {
            saveLock.current = false; setSaving(false)
        }
    }

    if (user?.role !== 'ADMIN') {
        return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>Access Denied. Administrators only.</div>
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '1.875rem', color: '#006B3C' }}>User Management</h1>
                    <p style={{ margin: 0, color: '#6B7280' }}>Manage accounts and roles.</p>
                </div>
                <button onClick={openCreateModal} style={{ background: '#006B3C', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    + New User
                </button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search users"
                    style={{ flex: '1 1 250px', minWidth: 0, padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB' }}
                />
                <select aria-label="Filter users by role"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white' }}
                >
                    <option value="">All Roles</option>
                    <option value="REQUESTER">Requester</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="ADMIN">Administrator</option>
                </select>
            </div>

            {error && <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 8, marginBottom: 24 }}>{error}<button className="btn btn-secondary" onClick={() => setRevision(n => n + 1)}>Retry users</button></div>}

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div role="region" aria-label="User accounts table" tabIndex={0} style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                        <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <tr>
                                <th style={{ padding: '12px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Name</th>
                                <th style={{ padding: '12px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Email</th>
                                <th style={{ padding: '12px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Role</th>
                                <th style={{ padding: '12px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Status</th>
                                <th style={{ padding: '12px 24px', fontSize: '0.875rem', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>Loading users...</td></tr>}
                            {!loading && !error && users.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>No users found.</td></tr>}
                            {!loading && users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #E5E7EB', opacity: 1 }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#111827' }}>{u.name}</td>
                                    <td style={{ padding: '16px 24px', color: '#4B5563' }}>{u.email}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ 
                                            background: u.role === 'ADMIN' ? '#FEF2F2' : u.role === 'IT_STAFF' ? '#EFF6FF' : '#F3F4F6', 
                                            color: u.role === 'ADMIN' ? '#991B1B' : u.role === 'IT_STAFF' ? '#1D4ED8' : '#374151', 
                                            padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 
                                        }}>
                                            {u.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {u.isActive 
                                            ? <span style={{ color: '#047857', fontWeight: 600, fontSize: '0.875rem' }}>Active</span>
                                            : <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>Inactive</span>
                                        }
                                        {u.mustChangePassword && <div style={{ fontSize: '0.7rem', color: '#92400E', marginTop: 4 }}>Needs Password Reset</div>}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button onClick={() => openEditModal(u)} style={{ background: 'transparent', border: '1px solid #D1D5DB', color: '#374151', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <Dialog title={modalMode === 'CREATE' ? 'Create New User' : 'Edit User'} onClose={closeModal} busy={saving}>
                        {modalError && <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>{modalError}</div>}
                        {passwordResetMsg && <div role="status" style={{ background: '#D1FAE5', color: '#065F46', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>{passwordResetMsg}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label htmlFor="user-full-name" style={{ display: 'block', marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Full Name</label>
                                <input id="user-full-name" disabled={saving} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 8 }} />
                            </div>
                            <div>
                                <label htmlFor="user-email" style={{ display: 'block', marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Email Address</label>
                                <input id="user-email" disabled={saving} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 8 }} />
                            </div>
                            <div>
                                <label htmlFor="user-role" style={{ display: 'block', marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Role</label>
                                <select disabled={saving} id="user-role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 8, background: 'white' }}>
                                    <option value="REQUESTER">Requester</option>
                                    <option value="IT_STAFF">IT Staff</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>

                            {modalMode === 'EDIT' && (
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input disabled={saving} type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: 18, height: 18 }} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Account is Active</span>
                                    </label>
                                </div>
                            )}

                            <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                                <label htmlFor="user-password" style={{ display: 'block', marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                                    {modalMode === 'CREATE' ? 'Initial Password' : 'Set New Password (Optional)'}
                                </label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <input disabled={saving} id="user-password"
                                        type="text" 
                                        placeholder="e.g. password123" 
                                        value={formData.initialPassword} 
                                        onChange={e => setFormData({ ...formData, initialPassword: e.target.value })} 
                                        style={{ flex: 1, padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 8 }} 
                                    />
                                    {modalMode === 'EDIT' && (
                                        <button 
                                            onClick={handleResetPassword} 
                                            disabled={saving || !formData.initialPassword} 
                                            style={{ background: '#F3F4F6', color: '#111827', border: '1px solid #D1D5DB', padding: '0 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                {modalMode === 'CREATE' && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>User will be forced to change this upon first login.</p>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                            <button onClick={closeModal} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !formData.name || !formData.email} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#006B3C', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                {saving ? 'Saving...' : 'Save User'}
                            </button>
                        </div>
                </Dialog>
            )}
        </div>
    )
}
