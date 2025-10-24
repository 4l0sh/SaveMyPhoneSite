"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./components/HomePage";
import ModelSelection from "./components/ModelSelection";
import RepairSelection from "./components/RepairSelection";
import BookingPage from "./components/BookingPage";
import StatusPage from "./components/StatusPage";
import Login from "./components/login";
import Admin from "./components/admin";
import EditModel from "./components/EditModel";
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/model" element={<ModelSelection />} />
          <Route path="/repair" element={<RepairSelection />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/savemyphone-wizard-login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit" element={<EditModel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
