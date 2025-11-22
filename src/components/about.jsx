import React from "react";
import "./about.css";

const About = () => {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-title">Over Save my Phone</h1>
            <p className="about-subtitle">
              Vakkundige smartphone- en tabletreparaties, met heldere
              communicatie en service waar je op kunt rekenen. Wij bestaan al
              meer dan 10 jaar.
            </p>
          </div>
        </div>
      </header>

      <main className="about-main">
        <div className="container">
          <section className="about-section grid-2">
            <div className="about-card">
              <h2>Ons verhaal</h2>
              <p>
                Bij <strong>Save my Phone</strong> draait alles om kwaliteit en
                betrouwbaarheid. We helpen dagelijks klanten met snelle en
                professionele reparaties voor iPhone, Samsung en vele andere
                merken. Je krijgt vooraf duidelijkheid over de kosten en we
                denken eerlijk mee: repareren of vervangen.
              </p>
              <p>
                Onze technici werken met hoogwaardige onderdelen en moderne
                tools. Veelvoorkomende reparaties, zoals scherm- en
                batterijvervangingen, voeren we vaak dezelfde dag uit — soms
                zelfs terwijl je wacht.
              </p>
            </div>

            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div className="stat-text">
                  <div className="stat-value" data-edit="years">
                    Meer dan 10 jaar
                  </div>
                  <div className="stat-label">ervaring</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-screwdriver-wrench"></i>
                </div>
                <div className="stat-text">
                  <div className="stat-value" data-edit="repairs">
                    Duizenden
                  </div>
                  <div className="stat-label">reparaties uitgevoerd</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fa-solid fa-shield"></i>
                </div>
                <div className="stat-text">
                  <div className="stat-value" data-edit="warranty">
                    6 maanden
                  </div>
                  <div className="stat-label">garantie</div>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2 className="section-title">Onze waarden</h2>
            <div className="values-grid">
              <div className="value-card">
                <i className="fa-solid fa-thumbs-up value-icon"></i>
                <h3>Betrouwbaar</h3>
                <p>Heldere prijzen en eerlijk advies, zonder verrassingen.</p>
              </div>
              <div className="value-card">
                <i className="fa-solid fa-battery-full value-icon"></i>
                <h3>Kwaliteit</h3>
                <p>Onderdelen van hoge kwaliteit en vakkundige montage.</p>
              </div>
              <div className="value-card">
                <i className="fa-solid fa-stopwatch value-icon"></i>
                <h3>Snel</h3>
                <p>
                  Veel reparaties klaar terwijl je wacht (voorraad afhankelijk).
                </p>
              </div>
              <div className="value-card">
                <i className="fa-solid fa-user-group value-icon"></i>
                <h3>Service</h3>
                <p>Persoonlijke aandacht en duidelijke communicatie.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2 className="section-title">Mijlpalen</h2>
            <ul className="timeline">
              <li>
                <span className="dot" />
                <div>
                  <strong data-edit="founded">Start van Save my Phone</strong>
                  <p>
                    Onze eerste klanten geholpen met snelle en eerlijke service.
                  </p>
                </div>
              </li>
              <li>
                <span className="dot" />
                <div>
                  <strong>Uitbreiding assortiment</strong>
                  <p>
                    Meer onderdelen op voorraad voor nog snellere afhandeling.
                  </p>
                </div>
              </li>
              <li>
                <span className="dot" />
                <div>
                  <strong>Duizenden reparaties</strong>
                  <p>
                    Met consistent hoge klanttevredenheid en transparante
                    tarieven.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="about-cta">
            <div className="cta-card">
              <h2>Vragen of direct langskomen?</h2>
              <p>
                <i className="fa-solid fa-phone-volume call-icon"></i> Bel ons
                op <a href="tel:0365256149">036 525 6149</a> of stuur een
                WhatsApp naar{" "}
                <i className="fa-brands fa-whatsapp whatsapp-icon"></i>{" "}
                <a href="https://wa.me/0620808787">06 20808787</a>.
              </p>
              <div className="cta-actions">
                <a className="btn-primary" href="/contact">
                  Contact
                </a>
                <a className="btn-secondary" href="/status">
                  Volg je reparatie
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;
