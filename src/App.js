import './App.css';

// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import Profile from "./pages/Profile";
import Packs from "./pages/Packs";
import PackDetails from "./pages/PackDetails";

// Auth Components
import MultiStepSignup from './components/auth/MultiStepSignup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ProfileCompletion from './components/auth/ProfileCompletion';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import CourseList from './components/admin/CourseList';
import CourseForm from './components/admin/CourseForm';
import AdminSettings from './components/admin/AdminSettings';
import UserList from './components/admin/UserList';
import InquiriesList from './components/admin/InquiriesList';
import PackList from './components/admin/PackList';
import PackForm from './components/admin/PackForm';

// Import the admin components from pages
import UserManagement from './pages/admin/UserManagement';
import Dashboard from './pages/admin/Dashboard';
import AddSamplePacks from './pages/admin/AddSamplePacks';

import AccommodationList from './components/admin/AccommodationList';
import AccommodationForm from './components/admin/AccommodationForm';
import ExperienceList from './components/admin/ExperienceList';
import ExperienceForm from './components/admin/ExperienceForm';

// Layout component that handles conditional footer rendering
const Layout = () => {
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
          <Route path="/packs" element={<Packs />} />
          <Route path="/packs/:packId" element={<PackDetails />} />
          
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
          
          <Route path="/profile" element={<PrivateRoute requireProfileCompletion={true} />}>
            <Route index element={<Profile />} />
          </Route>
          
          {/* Protected Admin Routes - require profile completion */}
          <Route path="/admin" element={<PrivateRoute requireAdmin={true} requireProfileCompletion={true} />}>
            <Route element={<AdminDashboard />}>
              <Route index element={<Dashboard />} />
              
              {/* Courses Management */}
              <Route path="courses" element={<CourseList />} />
              <Route path="courses/new" element={<CourseForm />} />
              <Route path="courses/edit/:id" element={<CourseForm />} />
              
              {/* Packs Management */}
              <Route path="packs" element={<PackList />} />
              <Route path="packs/new" element={<PackForm />} />
              <Route path="packs/edit/:id" element={<PackForm />} />
              <Route path="packs/add-samples" element={<AddSamplePacks />} />
              
              {/* Accommodations Management */}
              <Route path="accommodations" element={<AccommodationList />} />
              <Route path="accommodations/new" element={<AccommodationForm />} />
              <Route path="accommodations/edit/:id" element={<AccommodationForm />} />
              
              {/* Experiences Management */}
              <Route path="experiences" element={<ExperienceList />} />
              <Route path="experiences/new" element={<ExperienceForm />} />
              <Route path="experiences/edit/:id" element={<ExperienceForm />} />
              
              {/* User Management */}
              <Route path="users" element={<UserList />} />
              <Route path="users/management" element={<UserManagement />} />
              <Route path="inquiries" element={<InquiriesList />} />
              
              {/* Future routes */}
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
        <PackProvider>
          <Layout />
        </PackProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
