"use client";

import { useState } from "react";
import "./BookingPage.css";
import ProgressBar from "./ProgressBar";

const BookingPage = ({
  selectedBrand,
  selectedModel,
  selectedRepairs,
  prevStep,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    additionalNotes: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Booking submitted:", {
      device: `${selectedBrand} ${selectedModel}`,
      repairs: selectedRepairs,
      customerInfo: formData,
    });
    setIsSubmitted(true);
  };

  const calculateTotal = () => {
    return selectedRepairs.reduce((total, repair) => {
      return total + (repair.price || 0);
    }, 0);
  };

  const formatPrice = (price) => {
    return `€${price}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (isSubmitted) {
    return (
      <div className="booking-page">
        <ProgressBar currentStep={3} />
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Booking Confirmed!</h2>
            <p className="success-message">
              Thank you for choosing Save my Phone. We have received your
              booking request and will contact you shortly to confirm your
              appointment.
            </p>
            <div className="booking-summary">
              <h3>Booking Details:</h3>
              <p>
                <strong>Device:</strong> {selectedBrand} {selectedModel}
              </p>
              <p>
                <strong>Repairs:</strong>{" "}
                {selectedRepairs.map((r) => r.name).join(", ")}
              </p>
              <p>
                <strong>Preferred Date:</strong> {formData.preferredDate}
              </p>
              <p>
                <strong>Preferred Time:</strong> {formData.preferredTime}
              </p>
              <p>
                <strong>Contact:</strong> {formData.email}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Book Another Repair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <ProgressBar currentStep={3} />

      <main className="main-content">
        <div className="container">
          <div className="content-wrapper">
            <div className="booking-section">
              <div className="booking-card">
                <div className="back-arrow" onClick={prevStep}>
                  <span className="arrow">←</span>
                </div>

                <div className="booking-header">
                  <h2 className="booking-title">Book Your Appointment</h2>
                  <p className="booking-subtitle">
                    Fill in your details to schedule your repair
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                  <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name *</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name *</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      Preferred Appointment Time
                    </h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="preferredDate">Preferred Date *</label>
                        <input
                          type="date"
                          id="preferredDate"
                          name="preferredDate"
                          value={formData.preferredDate}
                          onChange={handleInputChange}
                          min={getTomorrowDate()}
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="preferredTime">Preferred Time *</label>
                        <select
                          id="preferredTime"
                          name="preferredTime"
                          value={formData.preferredTime}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        >
                          <option value="">Select a time</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Additional Information</h3>
                    <div className="form-group">
                      <label htmlFor="additionalNotes">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="additionalNotes"
                        name="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={handleInputChange}
                        rows="4"
                        className="form-input"
                        placeholder="Any additional information about your device or repair needs..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary submit-btn"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="summary-section">
              <div className="booking-summary-card">
                <h3 className="summary-title">Booking Summary</h3>

                <div className="device-summary">
                  <div className="device-icon">📱</div>
                  <div>
                    <h4 className="device-name">
                      {selectedBrand} {selectedModel}
                    </h4>
                    <p className="device-type">Smartphone</p>
                  </div>
                </div>

                <div className="repairs-summary">
                  <h4 className="repairs-title">Selected Repairs:</h4>
                  {selectedRepairs.map((repair) => (
                    <div key={repair.id} className="repair-summary-item">
                      <div className="repair-info">
                        <span className="repair-name">{repair.name}</span>
                        <span className="repair-duration">
                          {repair.duration}
                        </span>
                      </div>
                      <div className="repair-price">
                        {repair.price
                          ? formatPrice(repair.price)
                          : "Price on request"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-summary">
                  <div className="total-row">
                    <span className="total-label">Estimated Total:</span>
                    <span className="total-price">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>
                  <p className="total-note">
                    *Final price may vary after device inspection
                  </p>
                </div>

                <div className="contact-info">
                  <h4 className="contact-title">Our Location</h4>
                  <p className="contact-details">
                    123 Repair Street
                    <br />
                    Amsterdam, 1012 AB
                    <br />
                    Netherlands
                    <br />
                    <br />
                    <strong>Phone:</strong> +31 20 123 4567
                    <br />
                    <strong>Email:</strong> info@savemyphone.nl
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
