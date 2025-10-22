import React from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import LaunchFlow from './pages/LaunchFlow'
import SessionView from './pages/SessionView'
import AgentsDirectory from './pages/AgentsDirectory'
import ProjectsCounters from './pages/ProjectsCounters'

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{display:'flex', gap:16, padding:12, borderBottom:'1px solid #ddd'}}>
        <Link to="/">Launch Flow</Link>
        <Link to="/session">Session</Link>
        <Link to="/agents">Agents</Link>
        <Link to="/projects">Projects</Link>
      </nav>
      <div style={{padding:16}}>
        <Routes>
          <Route path="/" element={<LaunchFlow/>} />
          <Route path="/session" element={<SessionView/>} />
          <Route path="/agents" element={<AgentsDirectory/>} />
          <Route path="/projects" element={<ProjectsCounters/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
