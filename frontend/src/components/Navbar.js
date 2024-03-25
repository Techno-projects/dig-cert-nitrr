import React, { useContext } from "react";
import { LoginContext } from "../App";
import { Link } from "react-router-dom";
import "../components/css/Navbar.css";
import { AiOutlineHome } from "react-icons/ai";
import nitrr_logo from "../components/images/NITRR Logo.png";
import techno_logo from "../components/images/TC_Logo White.png";

const Navbar = () => {
  const { userLoggedIn, facultyLoggedIn, userLogout, facultyLogout } =
    useContext(LoginContext);

  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="logo">
          <img src={nitrr_logo} className="nitlogo" alt="NITRR_Logo" />
          <img src={techno_logo} alt="NITRR_Logo" />
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">
              <button className="home-btn">
                {" "}
                <AiOutlineHome />
              </button>
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
