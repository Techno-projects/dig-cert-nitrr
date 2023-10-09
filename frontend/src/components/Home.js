import React from 'react';
import {Link} from 'react-router-dom';

const Home = () => (
    <div className="container">
      <h1 className="title">Register</h1>
      <div className="register-options">
        <Link to="/register/faculty">
          <button className="register-button">Register as Faculty</button>
        </Link>
        <Link to="/register/admin">
          <button className="register-button">Register as Admin</button>
        </Link>
      </div>


      <h1 className="title">Login</h1>
      <div className="register-options">
        <Link to="/login/faculty">
          <button className="register-button">Login as Faculty</button>
        </Link>
        <Link to="/login/admin">
          <button className="register-button">Login as Admin</button>
        </Link>
      </div>
    </div>
);

export default Home;