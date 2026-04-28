import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './DepartmentStyles.css';

const FacultyDetail = () => {
    const [member, setMember] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFacultyDetail = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5001/api/faculty/${id}`);
                const data = await response.json();
                setMember(data);
            } catch (error)
 {
                console.error("Failed to fetch faculty details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFacultyDetail();
    }, [id]);


    
    // This function navigates to the map to start live routing
    const handleGetDirections = () => {
        const destBuilding = member?.office?.building?.location ? member.office.building : 
                            (member?.department?.building?.location ? member.department.building : null);

        if (destBuilding?.location) {
            const destination = destBuilding.location.coordinates;
            const destinationName = member.department.name;
            
            // Ask for location permission first
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Permission granted
                        navigate('/map', {
                            state: {
                                destination: destination,
                                destinationName: destinationName
                            }
                        });
                    },
                    (error) => {
                        // Permission denied or error
                        alert("Please turn on your location to get accurate directions.");
                        // Proceed to map anyway to allow manual start point entry if needed
                        navigate('/map', {
                            state: {
                                destination: destination,
                                destinationName: destinationName
                            }
                        });
                    },
                    { timeout: 5000 } // Add a timeout to prevent hanging forever
                );
            } else {
                // Navigate without location if not supported
                navigate('/map', {
                    state: {
                        destination: destination,
                        destinationName: destinationName
                    }
                });
            }
        } else {
            alert("Location data is currently unavailable for this department.");
        }
    };

    if (loading) {
        return <div className="loading-spinner"></div>;
    }
    
    if (!member) {
        return <div>Faculty member not found.</div>
    }

    return (
        <div className="department-container">
            <Link to={`/departments/${member.department._id}`} className="back-link">&larr; Back to {member.department.name} Faculty</Link>
            <div className="faculty-detail-card">
                <div className="faculty-profile-header">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=150`} 
                        alt={`${member.name} Avatar`} 
                        className="faculty-avatar"
                    />
                    <div className="faculty-profile-titles">
                        <h2>{member.name}</h2>
                        <p className="faculty-title">{member.title}</p>
                    </div>
                </div>
                
                <div className="faculty-info">
                    <p><strong>Department:</strong> {member.department.name}</p>
                    <p><strong>Room Number:</strong> {member.office.roomNumber}</p>
                    <p><strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a></p>
                    <p><strong>About:</strong> {member.details}</p>
                </div>
                <div className="button-group">
                    <button onClick={handleGetDirections} className="map-button">
                        Get Directions to {member.department.name}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyDetail;