import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Select device" },
    { number: 2, label: "Select repair" },
    { number: 3, label: "Finalize order" },
  ];

  return (
    <div className="progress-container">
      <div className="progress-bar">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="progress-step">
              <div
                className={`step-number ${
                  currentStep > step.number
                    ? "completed"
                    : currentStep === step.number
                    ? "active"
                    : "inactive"
                }`}
              >
                {step.number}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  currentStep > step.number ? "completed" : ""
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
