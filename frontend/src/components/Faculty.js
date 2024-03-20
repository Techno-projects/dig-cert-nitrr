import React, { useState } from "react";
import "./css/Form.css";
import urls from "../urls.json";

const server = urls.SERVER_URL;

const FacultyRegistration = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    // organisation_code: '',
    // name: ''
  });

  const handleInputChange = (e) => {
    // console.log(e.target)
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${server}/api/faculty_register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    alert(data.message);
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

        {/* <input
          placeholder="Name:"
          className="input_text"
          type="text"
          id="Name"
          name="name"
          onChange={handleInputChange}
          required
        />

        <input
          placeholder="Organisation Code:"
          className="input_text"
          type="text"
          id="Name"
          name="organisation_code"
          onChange={handleInputChange}
          required
        /> */}

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

        <button type="submit" className="submit-btn">Submit</button>
      </form>
      </div>
    </div>
  );
};

export default FacultyRegistration;
