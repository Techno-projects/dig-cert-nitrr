import React from 'react';
import {Link} from 'react-router-dom';
import './css/Registration.css';

const Register = () => (
    <div className="register-container">
      <h1 className="title">Register</h1>
      <div className="register-options">
        <Link to="/register/faculty">
          <button className="register-button">Register as Faculty</button>
        </Link>
        <Link to="/register/admin">
          <button className="register-button">Register as Admin</button>
        </Link>
      </div>
    </div>
);

export default Register;