import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/savemyphone.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <nav className={`smp-navbar ${open ? "open" : ""}`}>
      <div className="smp-navbar-inner container">
        <div className="smp-left">
          <Link to="/" aria-label="Home">
            <img src={logo} alt="Save my Phone" className="smp-navbar-logo" />
          </Link>
        </div>
        <button
          className="smp-menu-toggle"
          aria-label="Menu"
          aria-expanded={open ? "true" : "false"}
          aria-controls="smp-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
        <div className="smp-nav-links" onClick={closeMenu}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Over ons
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Contact
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Shop
          </NavLink>
          <NavLink
            to="/blogs"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Blogs
          </NavLink>
          <a
            href="https://www.google.com/maps/place/Save+My+Phone/@52.3711856,5.2159026,17z/data=!3m1!4b1!4m6!3m5!1s0x47c616e11c27a2e1:0xb3b54ad7908b4f69!8m2!3d52.3711856!4d5.2184775!16s%2Fg%2F11c5zjlvh7?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="smp-rating nav-link"
            aria-label="Bekijk onze Google reviews score 4.8 van 5"
          >
            <i
              className="fa-brands fa-google smp-rating-google"
              aria-hidden="true"
            ></i>
            <span className="smp-rating-stars" aria-hidden="true">
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star-half-stroke"></i>
            </span>
            <span className="smp-rating-text">4.8/5</span>
          </a>
        </div>
        <div className="smp-right">
          <Link to="/status" className="smp-navbar-cta">
            <i className="fa-solid fa-magnifying-glass"></i>
            <span>Volg je reparatie</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
