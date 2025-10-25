"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./components/HomePage.jsx";
import ModelSelection from "./components/ModelSelection.jsx";
import RepairSelection from "./components/RepairSelection.jsx";
import BookingPage from "./components/BookingPage.jsx";
import StatusPage from "./components/StatusPage.jsx";
import Login from "./components/login.jsx";
import Admin from "./components/admin.jsx";
import EditModel from "./components/EditModel.jsx";
import AddRepairType from "./components/AddRepairType.jsx";
import RepairTypesList from "./components/RepairTypesList.jsx";
import EditRepairType from "./components/EditRepairType.jsx";
import BrandsOrder from "./components/BrandsOrder.jsx";
import ModelsOrder from "./components/ModelsOrder.jsx";
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
          <Route path="/admin/repairs/new" element={<AddRepairType />} />
          <Route path="/admin/repairs" element={<RepairTypesList />} />
          <Route path="/admin/repairs/:id/edit" element={<EditRepairType />} />
          <Route path="/admin/brands/order" element={<BrandsOrder />} />
          <Route path="/admin/models/order" element={<ModelsOrder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
