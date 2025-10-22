"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BookingPage.css";
import ProgressBar from "./ProgressBar";

const BookingPage = (props) => {
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

  const navigate = useNavigate();

  // State for device/repair info, fallback to props if available
  const [selectedBrand, setSelectedBrand] = useState(props.selectedBrand || "");
  const [selectedModel, setSelectedModel] = useState(props.selectedModel || "");
  const [selectedRepairs, setSelectedRepairs] = useState(
    props.selectedRepairs || []
  );
  const prevStep = props.prevStep;

  useEffect(() => {
    // If any required info is missing, try to load from localStorage
    if (!selectedBrand || !selectedModel || selectedRepairs.length === 0) {
      const brand = localStorage.getItem("selectedBrand");
      const model = localStorage.getItem("selectedModel");
      const repairs = localStorage.getItem("selectedRepairs");
      if (brand && model && repairs) {
        setSelectedBrand(brand);
        setSelectedModel(model);
        try {
          setSelectedRepairs(JSON.parse(repairs));
        } catch {
          setSelectedRepairs([]);
        }
      } else {
        // If still missing, redirect to start
        navigate("/");
      }
    }
    // eslint-disable-next-line
  }, []);

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
            <h2 className="success-title">Afspraak bevestigd!</h2>
            <p className="success-message">
              Bedankt dat je voor Save my Phone hebt gekozen. We hebben je
              aanvraag ontvangen en nemen binnenkort contact met je op om de
              afspraak te bevestigen.
            </p>
            <div className="booking-summary">
              <h3>Afspraakdetails:</h3>
              <p>
                <strong>Toestel:</strong> {selectedBrand} {selectedModel}
              </p>
              <p>
                <strong>Reparaties:</strong>{" "}
                {selectedRepairs.map((r) => r.name).join(", ")}
              </p>
              <p>
                <strong>Voorkeursdatum:</strong> {formData.preferredDate}
              </p>
              <p>
                <strong>Voorkeurstijd:</strong> {formData.preferredTime}
              </p>
              <p>
                <strong>Contact:</strong> {formData.email}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Nog een reparatie plannen
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
                <div
                  className="back-arrow"
                  onClick={prevStep ? prevStep : () => navigate("/repair")}
                >
                  <span className="arrow">←</span>
                </div>

                <div className="booking-header">
                  <h2 className="booking-title">Plan je afspraak</h2>
                  <p className="booking-subtitle">
                    Vul je gegevens in om je reparatie in te plannen
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                  <div className="form-section">
                    <h3 className="section-title">Persoonlijke gegevens</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName">Voornaam *</label>
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
                        <label htmlFor="lastName">Achternaam *</label>
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
                        <label htmlFor="email">E-mailadres *</label>
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
                        <label htmlFor="phone">Telefoonnummer *</label>
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
                      Voorkeurstijd voor afspraak
                    </h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="preferredDate">Voorkeursdatum *</label>
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
                        <label htmlFor="preferredTime">Voorkeurstijd *</label>
                        <select
                          id="preferredTime"
                          name="preferredTime"
                          value={formData.preferredTime}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        >
                          <option value="">Kies een tijd</option>
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
                    <h3 className="section-title">Aanvullende informatie</h3>
                    <div className="form-group">
                      <label htmlFor="additionalNotes">
                        Aanvullende opmerkingen (optioneel)
                      </label>
                      <textarea
                        id="additionalNotes"
                        name="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={handleInputChange}
                        rows="4"
                        className="form-input"
                        placeholder="Eventuele extra informatie over je toestel of reparatie..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary submit-btn"
                    >
                      Bevestig afspraak
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="summary-section">
              <div className="booking-summary-card">
                <h3 className="summary-title">Overzicht van de afspraak</h3>

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
                  <h4 className="repairs-title">Geselecteerde reparaties:</h4>
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
                          : "Prijs op aanvraag"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="total-summary">
                  <div className="total-row">
                    <span className="total-label">Geschatte totaalprijs:</span>
                    <span className="total-price">
                      {formatPrice(calculateTotal())}
                    </span>
                  </div>
                  <p className="total-note">
                    *De uiteindelijke prijs kan variëren na inspectie van het
                    toestel
                  </p>
                </div>

                <div className="contact-info">
                  <h4 className="contact-title">Onze locatie</h4>
                  <p className="contact-details">
                    123 Repair Street
                    <br />
                    Amsterdam, 1012 AB
                    <br />
                    Nederland
                    <br />
                    <br />
                    <strong>Telefoon:</strong> +31 20 123 4567
                    <br />
                    <strong>E-mail:</strong> info@savemyphone.nl
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
