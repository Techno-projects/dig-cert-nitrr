import React, { useContext } from "react";
import { LoginContext } from "../App";
import { Link } from "react-router-dom";
import "../components/css/Navbar.css";
import nitrr_logo from "../components/images/NITRR_logo.jpeg";

const Navbar = () => {
    const { userLoggedIn, facultyLoggedIn, userLogout, facultyLogout } =
        useContext(LoginContext);

    return (
        <div className="navbar-container">
            <nav className="navbar">
                <div className="logo">
                    <img src={nitrr_logo} alt="NITRR_Logo" />
                </div>
                <ul className="nav-links">
                    <li>
                        <Link to="/">
                            <button>Home</button>
                        </Link>
                    </li>
                    {userLoggedIn && (
                        <li>
                            <button onClick={userLogout}>Logout</button>
                        </li>
                    )}
                    {facultyLoggedIn && (
                        <li>
                            <button onClick={facultyLogout}>Logout</button>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Navbar;