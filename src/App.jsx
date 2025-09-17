"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Homepage from "./components/Homepage";
import ModelSelection from "./components/ModelSelection";
import RepairSelection from "./components/RepairSelection";
import BookingPage from "./components/BookingPage";
import StatusPage from "./components/StatusPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/model" element={<ModelSelection />} />
          <Route path="/repair" element={<RepairSelection />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/status" element={<StatusPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
