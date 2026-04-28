import React from 'react';
import './CampusMap.css'; // We'll add styles to this file

const NavigationInfoPanel = ({ destinationName, distance, onCancel }) => {
    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${meters} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    };

    return (
        <div className="navigation-panel">
            <div className="navigation-info">
                <p className="destination-text">To: <strong>{destinationName}</strong></p>
                <p className="distance-text">{formatDistance(distance)} remaining</p>
            </div>
            <button onClick={onCancel} className="cancel-nav-button">×</button>
        </div>
    );
};

export default NavigationInfoPanel;