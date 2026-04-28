import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Directions.css';

const Directions = () => {
    const navigate = useNavigate();

    // State for user inputs and selections
    const [startQuery, setStartQuery] = useState('');
    const [endQuery, setEndQuery] = useState('');
    const [startPoint, setStartPoint] = useState(null); // Can be a building object or the string 'current_location'
    const [endPoint, setEndPoint] = useState(null);
    
    // State for live search suggestions and loading/error messages
    const [startSuggestions, setStartSuggestions] = useState([]);
    const [endSuggestions, setEndSuggestions] = useState([]);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // --- API Search Logic (with debouncing) ---
    useEffect(() => {
        // Don't search if the input is what we set for current location
        if (startQuery.length < 2 || startPoint === 'current_location') {
            setStartSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`http://localhost:5001/api/buildings/search?q=${startQuery}`)
                .then(res => res.json())
                .then(data => setStartSuggestions(data));
        }, 300); // Wait 300ms after user stops typing
        return () => clearTimeout(timer);
    }, [startQuery]);

    useEffect(() => {
        if (endQuery.length < 2) {
            setEndSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`http://localhost:5001/api/buildings/search?q=${endQuery}`)
                .then(res => res.json())
                .then(data => setEndSuggestions(data));
        }, 300);
        return () => clearTimeout(timer);
    }, [endQuery]);

    // --- Geolocation Logic for "Your Current Location" ---
    const handleSelectCurrentLocation = () => {
        setIsLoadingLocation(true);
        setStartPoint('current_location');
        setStartQuery('Your Current Location');
        setStartSuggestions([]);
        setErrorMessage('Fetching your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLoadingLocation(false);
                setErrorMessage(''); // Clear message on success
            },
            (error) => {
                console.error("Geolocation error:", error);
                setErrorMessage('Could not get your location. Please check browser permissions and try again.');
                setIsLoadingLocation(false);
                setStartPoint(null); // Reset if it fails
                setStartQuery('');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSelectStart = (building) => {
        setStartPoint(building);
        setStartQuery(building.name);
        setStartSuggestions([]);
    };
    const handleSelectEnd = (building) => {
        setEndPoint(building);
        setEndQuery(building.name);
        setEndSuggestions([]);
    };

    // --- Navigation Logic ---
    const handleGetDirections = () => {
        setErrorMessage('');
        if (!startPoint || !endPoint) {
            setErrorMessage("Please select a valid start and end point.");
            return;
        }

        // If starting from current location, we only pass the destination.
        // The map component will automatically use the user's live position as the start.
        if (startPoint === 'current_location') {
            navigate('/map', {
                state: {
                    destination: endPoint.location.coordinates,
                    destinationName: endPoint.name
                }
            });
        } 
        // If starting from a building, pass both start and destination.
        else {
            navigate('/map', {
                state: {
                    start: startPoint.location.coordinates,
                    startName: startPoint.name,
                    destination: endPoint.location.coordinates,
                    destinationName: endPoint.name
                }
            });
        }
    };

    return (
        <div className="directions-container">
            <h2 className="page-title">Get Directions</h2>
            <div className="directions-form">
                <div className="input-group">
                    <label htmlFor="start">Start Location</label>
                    <input
                        id="start" type="text" placeholder="Search buildings or select current location..."
                        value={startQuery}
                        onChange={(e) => { setStartQuery(e.target.value); setStartPoint(null); }}
                        autoComplete="off"
                    />
                    {/* Show suggestions only when typing */}
                    {startQuery.length > 1 && startPoint !== 'current_location' && (
                        <ul className="suggestions-list">
                            {/* The special "Current Location" option always appears first */}
                            <li onClick={handleSelectCurrentLocation}>📍 Your Current Location</li>
                            {startSuggestions.map(b => (
                                <li key={b._id} onClick={() => handleSelectStart(b)}>{b.name}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="end">Destination</label>
                    <input
                        id="end" type="text" placeholder="Type to search buildings..."
                        value={endQuery}
                        onChange={(e) => { setEndQuery(e.target.value); setEndPoint(null); }}
                        autoComplete="off"
                    />
                    {endSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {endSuggestions.map(b => (
                                <li key={b._id} onClick={() => handleSelectEnd(b)}>{b.name}</li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                <button onClick={handleGetDirections} className="directions-button" disabled={isLoadingLocation}>
                    {isLoadingLocation ? 'Getting Location...' : 'Get Directions'}
                </button>
            </div>
        </div>
    );
};

export default Directions;