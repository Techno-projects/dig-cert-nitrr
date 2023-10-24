import React from 'react';
import "./css/Footer.css"

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
    
    <div className="footer">
      <div className='copyright'>
        Team Technocracy 2023
      </div>
    </div>
    
  </>
  );
};

export default Footer;