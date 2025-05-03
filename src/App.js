import './App.css';

// src/App.js
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Experiences from "./pages/Experiences";
import Houses from "./pages/Houses";
import Contact from "./pages/Contact";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/experiences" element={<Experiences />} />
        <Route path="/houses" element={<Houses />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
};


export default App;
