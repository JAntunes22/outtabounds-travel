import './App.css';

// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Unauthorized from './components/auth/Unauthorized';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';

// Public Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Experiences from "./pages/Experiences";
import Houses from "./pages/Houses";
import Contact from "./pages/Contact";

// Auth Components
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminHome from './components/admin/AdminHome';
import CourseList from './components/admin/CourseList';
import CourseForm from './components/admin/CourseForm';
import AdminSettings from './components/admin/AdminSettings';

// Layout component that handles conditional footer rendering
const Layout = () => {
  const location = useLocation();
  
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/houses" element={<Houses />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Auth Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<PrivateRoute requireAdmin={true} />}>
            <Route element={<AdminDashboard />}>
              <Route index element={<AdminHome />} />
              
              {/* Courses Management */}
              <Route path="courses" element={<CourseList />} />
              <Route path="courses/new" element={<CourseForm />} />
              <Route path="courses/edit/:id" element={<CourseForm />} />
              
              {/* Future routes */}
              <Route path="experiences" element={<div>Experiences Management</div>} />
              <Route path="accommodations" element={<div>Accommodations Management</div>} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
          
          {/* Fallback Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  );
};

export default App;
