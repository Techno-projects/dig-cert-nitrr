import React from "react";
import { Link } from "react-router-dom";
import './css/HomePage.css';

const HomePage = () => (
    <div className="HomePage-Container">
        <h1 className="title">Welcome to Digi-Certificate!</h1>
        <div className="navigation-options">
            <Link to="/Login">
                <button className="register-button">Login as User</button>
            </Link>
            <Link to="/Login?type=faculty">
                <button className="register-button">Login as Faculty</button>
            </Link>
        </div>
    </div>
);

export default  HomePage;