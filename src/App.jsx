"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import Contact from "./components/contact.jsx";
import EditModelDetails from "./components/EditModelDetails.jsx";
import DeleteModel from "./components/DeleteModel.jsx";

// Simple auth guard for admin routes
function isTokenValid() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    if (json && typeof json === "object" && json.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= json.exp) {
        // expired
        localStorage.removeItem("authToken");
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function RequireAuth({ children }) {
  const location = useLocation();
  const ok = isTokenValid();
  if (!ok) {
    return (
      <Navigate
        to="/savemyphone-wizard-login"
        replace
        state={{ from: location?.pathname || "/" }}
      />
    );
  }
  return children;
}
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
          <Route path="/contact" element={<Contact />} />
          <Route path="/savemyphone-wizard-login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/edit"
            element={
              <RequireAuth>
                <EditModel />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/repairs/new"
            element={
              <RequireAuth>
                <AddRepairType />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/repairs"
            element={
              <RequireAuth>
                <RepairTypesList />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/repairs/:id/edit"
            element={
              <RequireAuth>
                <EditRepairType />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/brands/order"
            element={
              <RequireAuth>
                <BrandsOrder />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/models/order"
            element={
              <RequireAuth>
                <ModelsOrder />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/models/edit-details"
            element={
              <RequireAuth>
                <EditModelDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/models/delete"
            element={
              <RequireAuth>
                <DeleteModel />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
