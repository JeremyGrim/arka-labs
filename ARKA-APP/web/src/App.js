import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/arka/Sidebar';
import TopBar from './components/arka/TopBar';
import ActivityPanel from './components/arka/ActivityPanel';
import Dashboard from './pages/arka/Dashboard';
import Flows from './pages/arka/FlowsPage';
import Sessions from './pages/arka/SessionsPage';
import Messages from './pages/arka/MessagesPage';
import Agents from './pages/arka/AgentsPage';
import Projects from './pages/arka/ProjectsPage';
import Meta from './pages/arka/Meta';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <div className="flex h-screen bg-[#0c111e]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/flows" element={<Flows />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/sessions/:id" element={<Sessions />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/meta" element={<Meta />} />
                  </Routes>
                </main>
                <ActivityPanel />
              </div>
            </div>
          </div>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
