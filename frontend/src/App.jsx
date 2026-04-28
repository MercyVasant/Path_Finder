import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import NavigationBar from './components/Navigation/NavigationBar';
import Footer from './components/Footer/Footer';

// Import components
import Home from './pages/Home/Home';
import Directions from './pages/Directions/Directions'; // <-- Import new component
import DepartmentList from './pages/Departments/DepartmentList';
import DepartmentFaculty from './pages/Departments/DepartmentFaculty';
import FacultyDetail from './pages/Departments/FacultyDetail';

import CollegeDetails from './pages/Details/CollegeDetails'; 
const CampusMap = React.lazy(() => import('./pages/Map/CampusMap'));

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavigationBar />
        <main className="main-content">
          <Suspense fallback={<div className="loading-spinner"></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<CampusMap />} />
              {/* --- NEW ROUTE --- */}
              <Route path="/directions" element={<Directions />} />
              <Route path="/departments" element={<DepartmentList />} />
              <Route path="/departments/:id" element={<DepartmentFaculty />} />
              <Route path="/faculty/:id" element={<FacultyDetail />} />

              <Route path="/details" element={<CollegeDetails />} /> 
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;