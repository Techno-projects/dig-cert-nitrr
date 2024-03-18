import React, { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import FacultyLogin from "./FacultyLogin";
import "./css/Form.css";
import { LoginContext } from "../App";
import urls from '../urls.json';
import { Blob } from "./Blob";
const server = urls.SERVER_URL;


const Login = () => {
  // let { name } = useContext(AuthContext);

  const { setUserLoggedIn } = useContext(LoginContext);

  const searchParams = new URLSearchParams(window.location.search);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [userType, setUserType] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "faculty") {
      setUserType(1);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    console.log(e.target);
    e.preventDefault();

    try {
      const response = await fetch(`${server}/api/user_login `, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      console.log(response);
      if (response.ok) {
        setUserLoggedIn(true);
        const data = await response.json();
        localStorage.setItem("login", data.token);
        window.location.href = "/event_management";
      } else {
        setError(
          "Authentication failed. Please check your username and password."
        );
      }
    } catch {
      console.error("Error:", error);
    }
  };

  return (
    <>
      {userType === 1 ? (
        <FacultyLogin />
      ) : (
        <div>
          <Blob/>
          {/* <div>
            <a href='?type=faculty'>
              <input type='button' value="Faculty" />
            </a>
          </div> */}
          <div className="form-container" id="default">
            <div className="form-internal">
              <h1 className="title">Login</h1>
              <form className="form" onSubmit={handleSubmit}>
                <input
                  placeholder="Email ID"
                  className="input_text"
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

                <input
                  placeholder="Password"
                  className="input_text"
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button  className="submit-btn" type="submit">Submit</button>
              </form> 
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;