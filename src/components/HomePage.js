import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Import HomePage-specific styles

const HomePage = () => {
  const navigate = useNavigate();

  // Function to play click sound
  const playClickSound = () => {
    const audio = new Audio('/click-sound.mp3'); // Ensure this file exists in the public folder
    audio.play();
  };

  // Function to handle button click
  const handleButtonClick = (path) => {
    playClickSound();
    navigate(path); // Navigate to the specified path
  };

  // Button data
  const buttons = [
    {
      id: 1,
      title: 'Student Continuation Data Analysis From Report AB',
      path: '/student-continuation',
    },
    {
      id: 2,
      title: 'Requisition Quantity Verifying from From Requisition',
      path: '/requisition',
    },
    // Add more buttons here as needed
  ];

  return (
    <div className="app">
      {/* Logo at the top center */}
      <div className="logo-container">
        <img
          src="https://brac-kumon.com.bd/wp-content/uploads/2024/03/logo.svg"
          alt="BKL Logo"
          className="logo"
        />
      </div>

      <h1 className="page-title">BKL Data Processor</h1>
      <div className="button-grid">
        {buttons.map((button) => (
          <div
            key={button.id}
            className="card-button"
            onClick={() => handleButtonClick(button.path)}
          >
            <h3>{button.title}</h3>
          </div>
        ))}
      </div>

      {/* Copyright notice at the bottom right */}
      <footer className="footer">
        <p>
          &copy;{' '}
          <a href="mailto:shitabmir@gmail.com" className="email-link">
            shitabmir@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;