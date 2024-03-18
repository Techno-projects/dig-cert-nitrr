import React from "react";
import { Link } from "react-router-dom";
import './css/HomePage.css';
import { Blob } from "./Blob";

const HomePage = () => (
    <div className="HomePage-Container">
        <Blob/>
        <div className="vertical-text">TECHNOCRACY</div>
        <div className="HomePage-internal">
        <h1 className="title">Welcome to Digi-<span className="highlight">Certificate!</span></h1>
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