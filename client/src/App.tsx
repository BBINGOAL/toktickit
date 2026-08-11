import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'online' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const checkSystem = async () => {
    setStatus('loading')
    try {
      // เรียก 2 API พร้อมกัน
      const [healthRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:3000/api/health'),
        fetch('http://localhost:3000/api/categories'),
      ])

      if (!healthRes.ok || !categoriesRes.ok) throw new Error('Server error')

      const healthData = await healthRes.json()
      const categoriesData = await categoriesRes.json()

      if (healthData.status === 'ok') {
        setStatus('online')
        setCategories(categoriesData)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Unable to connect to TokTickIT API')
      setCategories([])
    }
  }


  return (
    <div className="container mt-5 text-center">
      <h1>TokTickIT</h1>
      <p>IT Service Desk</p>

      <button className="btn btn-primary" onClick={checkSystem}>
        Check System
      </button>

      {status === 'loading' && <p className="mt-3">⏳ loading...</p>}

      {status === 'error' && (
        <div className="mt-3 text-danger">
          <p>System Status: Offline ❌</p>
          <p>{errorMsg}</p>
        </div>
      )}

      {status === 'online' && (
        <div className="mt-3">
          <p className="text-success">System Status: Online ✅</p>
          <h5>Supported Request Categories:</h5>
          <ul className="list-unstyled">
            {categories.map((cat) => (
              <li key={cat.id}>• {cat.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

}

export default App
