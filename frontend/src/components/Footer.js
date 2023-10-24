import React from 'react';
import "./css/Footer.css"

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="copyright">
      Team Technocracy &copy; {currentYear} 
      </div>
    </footer>
  );
};

export default Footer;