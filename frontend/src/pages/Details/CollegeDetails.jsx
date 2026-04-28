import React, { useState, useEffect } from 'react';
import './CollegeDetails.css';

const CollegeDetails = () => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5001/api/details');
                const data = await response.json();
                setDetails(data);
            } catch (error) {
                console.error("Failed to fetch college details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    return (
        <div className="details-container">
            <h2 className="page-title">Campus Overview</h2>
            
            {loading ? (
                <div className="loading-spinner"></div>
            ) : !details ? (
                <p>Could not load college details.</p>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card">
                            <h3>{details.buildingCount}</h3>
                            <p>Total Buildings</p>
                        </div>
                        <div className="summary-card">
                            <h3>{details.departmentCount}</h3>
                            <p>Departments</p>
                        </div>
                        <div className="summary-card">
                            <h3>{details.classroomCount || 0}</h3>
                            <p>Classrooms & Labs</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CollegeDetails;