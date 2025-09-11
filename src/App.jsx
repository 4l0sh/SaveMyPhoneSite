"use client";

import { useState } from "react";
import "./App.css";
import Homepage from "./components/Homepage";
import ModelSelection from "./components/ModelSelection";
import RepairSelection from "./components/RepairSelection";
import BookingPage from "./components/BookingPage";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedRepairs, setSelectedRepairs] = useState([]);

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Homepage
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <ModelSelection
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <RepairSelection
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedRepairs={selectedRepairs}
            setSelectedRepairs={setSelectedRepairs}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <BookingPage
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedRepairs={selectedRepairs}
            prevStep={prevStep}
          />
        );
      default:
        return <Homepage />;
    }
  };

  return <div className="App">{renderStep()}</div>;
}

export default App;
