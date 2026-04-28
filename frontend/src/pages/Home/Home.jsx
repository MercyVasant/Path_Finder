import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <header className="home-header">
                <h1 className="page-title">Welcome to Path Finder</h1>
                <p>Your all-in-one platform for navigating the campus and finding college details.</p>
            </header>

            <section className="features-grid">
                <Link to="/map" className="feature-card">
                    <h2>Interactive Map</h2>
                    <p>Explore the campus with a live, interactive map. Find buildings and track your location in real-time.</p>
                </Link>
                {/* This card is updated to point to the new departments page */}
                <Link to="/departments" className="feature-card">
                    <h2>Departments & Faculty</h2>
                    <p>Select a department to view its faculty members, their offices, and details.</p>
                </Link>
                
                <Link to="/details" className="feature-card">
                    <h2>College Details</h2>
                    <p>Get comprehensive information about campus facilities and buildings.</p>
                </Link>
            </section>
        </div>
    );
};

export default Home;