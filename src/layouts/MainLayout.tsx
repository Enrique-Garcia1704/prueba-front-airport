import React from 'react';
import { Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const MainLayout: React.FC = () => {
  return (
    <main className="main-layout-clean">
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>
      <Outlet />
    </main>
  );
};

export default MainLayout;
