import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRequesters } from '../api'
import type { Requester } from '../api'
import { useRequester } from '../context/RequesterContext'

export default function RequesterSelectionPage() {
    const { setRequester } = useRequester()
    const navigate = useNavigate()

    const [requesters, setRequesters] = useState<Requester[]>([])
    const [selectedId, setSelectedId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchRequesters()
            setRequesters(data)
        } catch {
            setError('Failed to load requesters. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    function handleSelect() {
        const found = requesters.find(r => r.id === parseInt(selectedId))
        if (!found) return
        setRequester(found)
        navigate('/create')
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 56px)',
            padding: 'var(--space-6)',
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 480 }}>
                <h2 style={{ marginBottom: 'var(--space-2)' }}>
                    Development Requester Selection
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
                    Choose a development requester to simulate the current requester context for Lab 2.
                </p>

                <div className="callout callout-warning" style={{ marginBottom: 'var(--space-4)' }}>
                    ⚠️ This is for testing only and is not a login screen.
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
                        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                            Loading requesters...
                        </p>
                    </div>
                )}

                {error && !loading && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="callout callout-error" style={{ marginBottom: 'var(--space-3)' }}>
                            {error}
                        </div>
                        <button className="btn btn-secondary" onClick={load} style={{ width: '100%' }}>
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && requesters.length === 0 && (
                    <div className="callout callout-warning">
                        No active requesters available. Please contact your administrator.
                    </div>
                )}

                {!loading && !error && requesters.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div>
                            <label className="form-label">
                                Development Requester <span className="required-star">*</span>
                            </label>
                            <select
                                value={selectedId}
                                onChange={e => setSelectedId(e.target.value)}
                            >
                                <option value="">— Select a requester —</option>
                                {requesters.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                Only active development requesters are shown.
                            </p>
                        </div>

                        <div className="callout callout-info">
                            🔒 Authentication coming in Lab 3 — this selection will be replaced with secure authentication.
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSelect}
                            disabled={!selectedId}
                            style={{ width: '100%' }}
                        >
                            Select Requester
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
