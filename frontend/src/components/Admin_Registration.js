import React, { useState } from "react";
import { Link } from "react-router-dom";

const AdminRegistration = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    organisation_code: "",
  });

  const handleInputChange = (e) => {
    // console.log(e.target)
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    console.log(formData);
    e.preventDefault();

    // Send form data to the API endpoint
    /* The code is making a POST request to the 'http://localhost:8000/register' endpoint with the form
    data stored in the `formData` state variable. */
    const response = await fetch("http://localhost/user_register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    console.log(data);
    // .then(response => response.json())
    // .then(data => {
    //   // Handle the API response here
    //   console.log('API Response:', data);
    //   // Redirect user to another page if needed
    // }

    // .catch(error => {
    //   // Handle errors here
    //   console.error('Error:', error);
    // });
  };

  return (
    <div className="container">
      <h1 className="title">Admin Registration</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="email">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="clubName">Organisation Code:</label>
        <input
          type="text"
          id="organisation_code"
          name="organisation_code"
          value={formData.organisation_code}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Submit</button>
      </form>
      <Link to="/">
        <button id="back">Back</button>
      </Link>
    </div>
  );
};

export default AdminRegistration;