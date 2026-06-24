import React from 'react';
import { Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const MainLayout: React.FC = () => {
  return (
    <main className="main-layout-clean">
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      <Outlet />
    </main>
  );
};

export default MainLayout;
