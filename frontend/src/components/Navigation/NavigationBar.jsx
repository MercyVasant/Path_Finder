import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink to="/" className="navbar-logo" onClick={closeMenu}>
                    Path Finder
                </NavLink>

                <div className="menu-icon" onClick={toggleMenu}>
                    <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <ul className={isMobileMenuOpen ? "nav-menu active" : "nav-menu"}>
                    <li className="nav-item">
                        <NavLink to="/" className="nav-link" end onClick={closeMenu}>Home</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/map" className="nav-link" onClick={closeMenu}>Map</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/directions" className="nav-link" onClick={closeMenu}>Directions</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/departments" className="nav-link" onClick={closeMenu}>Departments</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/details" className="nav-link" onClick={closeMenu}>College Details</NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default NavigationBar;