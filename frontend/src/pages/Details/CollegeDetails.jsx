import React, { useState, useEffect } from 'react';
import './CollegeDetails.css';

const CollegeDetails = () => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    // New state to manage which tab is active
    const [activeTab, setActiveTab] = useState('buildings');

    // Mock data for LDCE to populate your new grids
    const buildingsData = [
        { id: 1, name: "Main Administrative Building", code: "Block-1", coords: "23.0345° N, 72.5463° E" },
        { id: 2, name: "Annexe Building", code: "Block-2", coords: "23.0348° N, 72.5468° E" },
        { id: 3, name: "Workshop", code: "Block-6", coords: "23.0332° N, 72.5471° E" },
        { id: 4, name: "Library & Aryabhatta Hall", code: "Block-3", coords: "23.0351° N, 72.5459° E" }
    ];

    const departmentsData = [
        { id: 1, name: "Information Technology", head: "Dr. H.B. Patel", location: "Annexe Building, 2nd Floor" },
        { id: 2, name: "Computer Engineering", head: "Dr. S.M. Shah", location: "Annexe Building, 1st Floor" },
        { id: 3, name: "Mechanical Engineering", head: "Dr. P.R. Patel", location: "Main Building, Ground Floor" },
        { id: 4, name: "Civil Engineering", head: "Dr. R.B. Khasiya", location: "Block-4" }
    ];

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
            
            <div className="college-description">
                <p>
                    Lalbhai Dalpatbhai College of Engineering (commonly known as LDCE) is one of Ahmedabad's premier engineering institutions, located in the heart of the city. It is surrounded by renowned institutions such as the Physical Research Laboratory (PRL), Ahmedabad Textile Industry's Research Association (ATIRA), Indian Space Research Organisation (ISRO), Indian Institute of Management Ahmedabad (IIM-A), and the Centre for Environmental Planning and Technology (CEPT).
                </p>
                <p>
                    Established in 1948 with the objective of providing quality higher education in various branches of engineering, L.D.C.E. has witnessed remarkable growth and development over the decades. The college is affiliated with Gujarat Technological University and is administered by the Directorate of Technical Education, Government of Gujarat.
                </p>
            </div>

            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card">
                            <h3>{details?.buildingCount || 14}</h3>
                            <p>Total Buildings</p>
                        </div>
                        <div className="summary-card">
                            <h3>{details?.departmentCount || 16}</h3>
                            <p>Departments</p>
                        </div>
                        <div className="summary-card">
                            <h3>{details?.classroomCount || 85}</h3>
                            <p>Classrooms & Labs</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="tab-buttons">
                        <button 
                            className={`tab-btn ${activeTab === 'buildings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('buildings')}
                        >
                            Campus Buildings
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('departments')}
                        >
                            Departments
                        </button>
                    </div>

                    {/* Tab Content Section */}
                    <div className="details-section">
                        {activeTab === 'buildings' && (
                            <div className="data-grid">
                                {buildingsData.map(bldg => (
                                    <div key={bldg.id} className="building-list-item">
                                        <h4>{bldg.name}</h4>
                                        <p>Identifier: {bldg.code}</p>
                                        <p className="coord-text">{bldg.coords}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'departments' && (
                            <div className="dept-data-list">
                                {departmentsData.map(dept => (
                                    <div key={dept.id} className="dept-data-item">
                                        <h4>{dept.name}</h4>
                                        <p><strong>HOD:</strong> {dept.head}</p>
                                        <p><strong>Location:</strong> {dept.location}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CollegeDetails;