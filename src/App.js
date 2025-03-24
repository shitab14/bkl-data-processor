import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import StudentContinuationPage from './components/StudentContinuationPage';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Homepage Route */}
        <Route path="/" element={<HomePage />} />

        {/* StudentContinuationPage Route */}
        <Route path="/student-continuation" element={<StudentContinuationPage />} />

        {/* Add more routes here if needed */}
      </Routes>
    </Router>
  );
};

export default App;