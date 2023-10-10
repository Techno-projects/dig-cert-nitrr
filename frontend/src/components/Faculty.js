import React, { useState } from 'react';

const FacultyRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organisation_code: '',
    name: ''
  });

  const handleInputChange = (e) => {
    // console.log(e.target)
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:8000/api/faculty_register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    const data = await response.json()
  };
  return (
    <div className="container">
      <h1 className="title">Faculty Registration</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="Email">Email:</label>
        <input type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />

        <label htmlFor="Name">Name:</label>
        <input type="text" id="Name" name="name" onChange={handleInputChange} required />

        <label htmlFor="Name">Organisation Code:</label>
        <input type="text" id="Name" name="organisation_code" onChange={handleInputChange} required />

        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default FacultyRegistration;
