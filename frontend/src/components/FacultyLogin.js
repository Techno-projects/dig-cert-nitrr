import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { LoginContext } from "../App";
import "./css/Form.css";
import urls from "../urls.json";
import { Blob } from "./Blob";
import toast from "react-hot-toast";
import { Spinner, ButtonSpinner } from "./Spinner";

const server = urls.SERVER_URL;

const FacultyLogin = () => {
  const { setFacultyLoggedIn } = useContext(LoginContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      let response = await fetch(`${server}/api/faculty_login `, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      response = await response.json();

      if (response.ok) {
        setFacultyLoggedIn(true);
        localStorage.setItem("login", response.token);
        toast.success("Logged in successfully!");
        navigate("/table", {
          state: { email: formData.email },
        });
      } else {
        toast.error(
          response.message ??
            "Authentication failed. Please check your username and password."
        );
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div>
      <Blob />

      <div className="form-container">
        <div className="form-internal">
          <h1 className="title">Login</h1>

          <form className="form" onSubmit={handleSubmit}>
            <input
              placeholder="User ID"
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

            <button type="submit" className="submit-btn" disabled={loginLoading}>
              {loginLoading ? <ButtonSpinner text="Logging in..." /> : "Submit"}
            </button>
          </form>
          {
            <Link to="/register/faculty">
              <span style={{ color: "white", textDecoration: "underline" }}>
                New User? Register Here.
              </span>
            </Link>
          }
        </div>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default FacultyLogin;
