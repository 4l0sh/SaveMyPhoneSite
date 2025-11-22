import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Over Save my Phone</h3>
            <p>
              Wij zijn professionele telefoonreparateurs met meer dan 10 jaar
              ervaring. We gebruiken uitsluitend originele onderdelen en geven
              garantie op alle reparaties.
            </p>
            <br />
            <p>KVK nummer: 94608547</p>
            <p>BTW nummer: NL002415116B80</p>
          </div>
          <div className="footer-section">
            <h3>Onze locatie</h3>
            <p>
              Schutterstraat 42b
              <br />
              Almere, 1315 VJ
              <br />
              Nederland
              <br />
              <i className="fa-solid fa-phone-volume call-icon"></i>{" "}
              <a href="tel:0365256149">036 525 6149</a>
              <br />
              <i className="fa-brands fa-whatsapp whatsapp-icon"></i>{" "}
              <a href="https://wa.me/0620808787">06 20808787</a>
              <br />
              <i className="fa-solid fa-envelope call-icon"></i>{" "}
              <a href="mailto:info@savemysmartphone.nl">
                info@savemysmartphone.nl
              </a>
            </p>
          </div>

          <div className="footer-section">
            <h3>Openingstijden</h3>
            <p>
              Maandag: 12:00 - 18:00
              <br />
              Dinsdag - Zaterdag : 10:00 - 18:00
              <br />
              Donderdag: 10:00 - 20:00
              <br />
              Zondag: 12:00 - 17:00
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Save my Phone. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
