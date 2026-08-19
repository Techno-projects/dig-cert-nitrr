import React, { useState } from "react";
import "./css/Form.css";
import urls from "../urls.json";
import toast from "react-hot-toast";
import { ButtonSpinner } from "./Spinner";

const server = urls.SERVER_URL;

const FacultyRegistration = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${server}/api/faculty_register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.ok) {
        toast.success(data.message || "Faculty registered successfully!");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
        <div className="form-internal">
      <h1 className="title">Faculty Registration</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
          placeholder="Email:"
          className="input_text"
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <input
          placeholder="Password:"
          className="input_text"
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? <ButtonSpinner text="Registering..." /> : "Submit"}
        </button>
      </form>
      </div>
    </div>
  );
};

export default FacultyRegistration;
