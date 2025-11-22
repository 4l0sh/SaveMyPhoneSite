import { useState } from "react";
import "./WhatsAppWidget.css";

// Floating WhatsApp widget: first click expands, second click confirms/open.
export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  // Confirmation removed: single open action

  const waHref = "https://wa.me/31620808787"; // target WhatsApp number

  const handleMainClick = () => {
    if (!open) {
      setOpen(true);
      return;
    }
    // When already open, go directly to WhatsApp
    window.open(waHref, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={`wa-widget ${open ? "wa-open" : ""}`}>
      <button
        className={`wa-fab ${open ? "wa-fab-open" : ""}`}
        aria-label={!open ? "Open WhatsApp hulp" : "Open WhatsApp"}
        onClick={handleMainClick}
      >
        {!open && (
          <i
            className="fa-brands fa-whatsapp wa-fa-icon"
            aria-hidden="true"
          ></i>
        )}
        {open && <span className="wa-label">Open WhatsApp</span>}
      </button>
      {open && (
        <div className="wa-panel" role="dialog" aria-modal="false">
          <div className="wa-panel-inner">
            <div className="wa-panel-header">
              <span className="wa-panel-title">Chat met ons</span>
              <button
                className="wa-close"
                aria-label="Sluiten"
                onClick={handleClose}
              >
                ×
              </button>
            </div>
            <p className="wa-text">
              Heb je een vraag? We reageren meestal snel via WhatsApp.
            </p>
            <p className="wa-number">+31 6 2080 8787</p>
            <button className="wa-action" onClick={handleMainClick}>
              Open WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
