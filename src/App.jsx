import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard1Alcaldia from './pages/Dashboard1Alcaldia';
import Dashboard2Gerencia from './pages/Dashboard2Gerencia';
import Dashboard3Financiero from './pages/Dashboard3Financiero';
import './index.css';

const Ico = ({ n, s = 16, c = '#64748b' }) => (
  <img src={`https://api.iconify.design/lucide:${n}.svg?color=${encodeURIComponent(c)}`}
    width={s} height={s} alt="" style={{ display:'block', flexShrink:0 }} />
);

const NAV_TABS = [
  { to: '/',          label: 'Alcaldía Municipal',  ico: 'building-2',   sub: 'Smart City · ODS'      },
  { to: '/gerencia',  label: 'Gerencia SEMAPA',     ico: 'gauge',        sub: 'Gestión Operacional'   },
  { to: '/financiero',label: 'Financiero',          ico: 'trending-up',  sub: 'Facturación · Mora'    },
];

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="clock-time">{time}</span>;
}

function TopNav() {
  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <div className="brand-icon">
          <Ico n="droplets" s={20} c="#ffffff" />
        </div>
        <div>
          <span className="brand-name">SEMAPA</span>
          <span className="brand-sub">BigData Platform</span>
        </div>
      </div>

      <div className="topnav-tabs">
        {NAV_TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `topnav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="tab-icon">
              <Ico n={tab.ico} s={16} c="#64748b" />
            </span>
            <span>
              <span className="tab-label">{tab.label}</span>
              <span className="tab-sub">{tab.sub}</span>
            </span>
          </NavLink>
        ))}
      </div>

      <div className="topnav-right">
        <div className="live-indicator">
          <span className="live-dot" />
          <span className="live-label">EN VIVO</span>
        </div>
        <div className="nav-clock">
          <LiveClock />
          <span className="clock-loc">Cochabamba, Bolivia</span>
        </div>
        <div className="nav-cluster">
          <span className="cluster-val">
            <img src="https://api.iconify.design/lucide:server.svg?color=%2364748b" width={11} height={11} alt=""
              style={{ display:'inline', marginRight:3, verticalAlign:'middle' }} />
            2 nodos
          </span>
          <span className="cluster-sub">Cassandra activo</span>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <TopNav />
        <div className="page-wrapper">
          <Routes>
            <Route path="/"           element={<Dashboard1Alcaldia />} />
            <Route path="/gerencia"   element={<Dashboard2Gerencia />} />
            <Route path="/financiero" element={<Dashboard3Financiero />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
