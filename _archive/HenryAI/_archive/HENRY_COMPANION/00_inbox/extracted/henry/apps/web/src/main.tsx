import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import './index.css';

function AppShell() {
  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <nav className="nav">
        <NavLink to="/" end className={({isActive})=>isActive?'active':''}>Chat</NavLink>
        <NavLink to="/settings" className={({isActive})=>isActive?'active':''}>Settings</NavLink>
        <NavLink to="/billing" className={({isActive})=>isActive?'active':''}>Pay</NavLink>
        <span style={{opacity:.6, marginLeft:'auto'}}>Henry</span>
      </nav>
      <div style={{flex:1, minHeight:0}}>
        <Routes>
          <Route path="/" element={<Chat/>} />
          <Route path="/settings" element={<Settings/>} />
          <Route path="/billing" element={<Billing/>} />
        </Routes>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell/>
    </BrowserRouter>
  </React.StrictMode>
);
