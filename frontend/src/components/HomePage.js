import React from "react";
import { Link } from "react-router-dom";
import './css/HomePage.css';

const HomePage = () => (
    <div className="HomePage-Container">
        <div className="HomePage-internal">
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
    </div>
);

export default  HomePage;