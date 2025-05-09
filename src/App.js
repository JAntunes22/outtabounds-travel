import './App.css';

// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { PackProvider } from './contexts/PackContext';
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
import YourPack from "./pages/YourPack";
import BookingDetails from "./pages/BookingDetails";
import TravelerDetails from "./pages/TravelerDetails";
import ReviewInquiry from "./pages/ReviewInquiry";

// Auth Components
import MultiStepSignup from './components/auth/MultiStepSignup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ProfileCompletion from './components/auth/ProfileCompletion';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminHome from './components/admin/AdminHome';
import CourseList from './components/admin/CourseList';
import CourseForm from './components/admin/CourseForm';
import AdminSettings from './components/admin/AdminSettings';
import UserList from './components/admin/UserList';

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
          
          {/* Pack & Booking Routes */}
          <Route path="/your-pack" element={<YourPack />} />
          <Route path="/booking-details" element={<BookingDetails />} />
          <Route path="/traveler-details" element={<TravelerDetails />} />
          <Route path="/review-inquiry" element={<ReviewInquiry />} />
          
          {/* Auth Routes */}
          <Route path="/signup" element={<MultiStepSignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected User Routes */}
          <Route path="/profile-completion" element={<PrivateRoute requireProfileCompletion={false} />}>
            <Route index element={<ProfileCompletion />} />
          </Route>
          
          {/* Protected Admin Routes - require profile completion */}
          <Route path="/admin" element={<PrivateRoute requireAdmin={true} requireProfileCompletion={true} />}>
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
              <Route path="users" element={<UserList />} />
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
        <PackProvider>
          <Layout />
        </PackProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
