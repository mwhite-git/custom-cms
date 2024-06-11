// src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { FaProjectDiagram, FaBlog, FaSignOutAlt, FaHome, FaTasks, FaUser } from 'react-icons/fa';
import PortfolioManager from './PortfolioManager';
import BlogManager from './BlogManager';
import DashboardHome from './DashboardHome';
import TodoApp from './TodoApp';
import UserProfile from './UserProfile';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [section, setSection] = useState('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 1024);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div className="admin-container flex flex-col min-h-screen bg-lightBackground dark:bg-darkBackground text-lightText dark:text-darkText">
      <nav className={`admin-navbar ${isMobile ? 'mobile-navbar' : 'sidebar'} bg-lightBackground dark:bg-gray-800 shadow-md`}>
        <ul className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-4 p-4">
          <li>
            <button onClick={() => setSection('home')} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaHome />
              <span>Home</span>
            </button>
          </li>
          <li>
            <button onClick={() => setSection('portfolio')} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaProjectDiagram />
              <span>Portfolio</span>
            </button>
          </li>
          <li>
            <button onClick={() => setSection('blog')} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaBlog />
              <span>Blog</span>
            </button>
          </li>
          <li>
            <button onClick={() => setSection('todo')} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaTasks />
              <span>To-Do</span>
            </button>
          </li>
          <li>
            <button onClick={() => setSection('profile')} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaUser />
              <span>Profile</span>
            </button>
          </li>
          <li>
            <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
      <main className="main-content flex-grow p-8">
        {section === 'home' && <DashboardHome />}
        {section === 'portfolio' && <PortfolioManager />}
        {section === 'blog' && <BlogManager />}
        {section === 'todo' && <TodoApp />} 
        {section === 'profile' && <UserProfile />}
      </main>
    </div>
  );
};

export default AdminDashboard;


