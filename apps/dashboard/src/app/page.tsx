'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'graph', label: 'Dependency Graph' },
    { id: 'api-map', label: 'API Map' },
    { id: 'findings', label: 'Findings' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>HunterOS Dashboard</h1>
      </header>

      <nav style={{ display: 'flex', gap: '0.5rem', padding: '1rem 2rem', borderBottom: '1px solid #1e293b' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#38bdf8' : 'transparent',
              color: activeTab === tab.id ? '#0f172a' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: '2rem' }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'graph' && <GraphTab />}
        {activeTab === 'api-map' && <ApiMapTab />}
        {activeTab === 'findings' && <FindingsTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </main>
    </div>
  );
}

function OverviewTab() {
  return (
    <div>
      <h2>Repository Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <StatCard title="Total Files" value="--" />
        <StatCard title="Languages" value="--" />
        <StatCard title="Frameworks" value="--" />
        <StatCard title="Findings" value="--" />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h3>Framework Detection</h3>
        <p style={{ color: '#64748b' }}>Run a scan to detect frameworks in your repository.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
      <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>{value}</div>
    </div>
  );
}

function GraphTab() {
  return (
    <div>
      <h2>Dependency Graph</h2>
      <p style={{ color: '#64748b' }}>The dependency graph visualization will appear here after running a scan.</p>
      <div style={{ width: '100%', height: '400px', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
        <span style={{ color: '#64748b' }}>No graph data available. Run `hunteros scan` first.</span>
      </div>
    </div>
  );
}

function ApiMapTab() {
  return (
    <div>
      <h2>API Map</h2>
      <p style={{ color: '#64748b' }}>Mapped API routes and their relationships will be displayed here.</p>
      <div style={{ width: '100%', height: '400px', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
        <span style={{ color: '#64748b' }}>No API routes detected.</span>
      </div>
    </div>
  );
}

function FindingsTab() {
  return (
    <div>
      <h2>Security Findings</h2>
      <p style={{ color: '#64748b' }}>Security review priorities and findings will be listed here.</p>
      <div style={{ marginTop: '1rem', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>Severity</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>Finding</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>File</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No findings yet. Run a scan to populate.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div>
      <h2>Reports</h2>
      <p style={{ color: '#64748b' }}>Generated reports will be listed here.</p>
      <div style={{ marginTop: '1rem', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No reports generated yet.
      </div>
    </div>
  );
}
