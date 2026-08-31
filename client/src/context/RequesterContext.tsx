import { createContext, useContext, useState, ReactNode } from 'react'
import type { Requester } from '../api'

interface RequesterContextValue {
    requester: Requester | null
    setRequester: (r: Requester | null) => void
}

const RequesterContext = createContext<RequesterContextValue | null>(null)

export function RequesterProvider({ children }: { children: ReactNode }) {
    const [requester, setRequester] = useState<Requester | null>(null)

    return (
        <RequesterContext.Provider value={{ requester, setRequester }}>
            {children}
        </RequesterContext.Provider>
    )
}

export function useRequester() {
    const ctx = useContext(RequesterContext)
    if (!ctx) throw new Error('useRequester must be used inside RequesterProvider')
    return ctx
}
