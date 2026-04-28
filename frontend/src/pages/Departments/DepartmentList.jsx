import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DepartmentStyles.css';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5001/api/departments');
                const data = await response.json();
                setDepartments(data);
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    // Handle debounced search for faculty
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        
        const timer = setTimeout(() => {
            fetch(`http://localhost:5001/api/faculty/search?q=${searchQuery}`)
                .then(res => res.json())
                .then(data => {
                    setSuggestions(data);
                    setShowSuggestions(true);
                })
                .catch(err => console.error("Failed to fetch faculty search:", err));
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectFaculty = (facultyId) => {
        navigate(`/faculty/${facultyId}`);
    };

    return (
        <div className="department-container">
            <h2 className="page-title">Our Departments</h2>
            <p className="department-intro">Select a department to view its faculty members and details.</p>

            <div className="faculty-search-container">
                <input 
                    type="text" 
                    className="faculty-search-input" 
                    placeholder="Search for a faculty member..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchQuery.length >= 2) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="faculty-search-suggestions">
                        {suggestions.map(faculty => (
                            <li key={faculty._id} onClick={() => handleSelectFaculty(faculty._id)}>
                                <strong>{faculty.name}</strong>
                                {faculty.department && <span> - {faculty.department.name}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                <div className="department-grid">
                    {departments.map(dept => (
                        <Link to={`/departments/${dept._id}`} key={dept._id} className="department-card">
                            <h3>{dept.name}</h3>
                            <p>Head of Department: {dept.hod}</p>
                            <span>View Faculty &rarr;</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DepartmentList;