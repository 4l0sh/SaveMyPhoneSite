import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Kies toestel" },
    { number: 2, label: "Kies reparatie" },
    { number: 3, label: "Bevestig afspraak" },
  ];

  return (
    <div className="progress-container">
      <div className="progress-bar">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div
              className={`progress-step ${
                currentStep === step.number ? "active-step" : ""
              }`}
            >
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
