import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'online' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const checkSystem = async () => {
    setStatus('loading')
    try {
      const res = await fetch('http://localhost:3000/api/health')
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      if (data.status === 'ok') {
        setStatus('online')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Unable to connect to TokTickIT API')
    }
  }

  return (
    <><div className="container mt-5 text-center">
      <h1>TokTickIT</h1>
      <p>IT Service Desk</p>
      <button onClick={checkSystem}>Check System</button>

      {status === 'loading' && <p>⏳ loading...</p>}
      {status === 'online' && <p>System Status: Online ✅</p>}
      {status === 'error' && <p>System Status: Offline ❌ — {errorMsg}</p>}
    </div>
    </>
  )
}

export default App
