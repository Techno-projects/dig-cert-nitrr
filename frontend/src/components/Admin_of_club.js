import React, { useState } from 'react';
import './css/Form.css';

const AdminRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    // console.log(e.target)
    const { name, value } = e.target;
    setFormData({ ...formData,[name]: value });
  };

  const handleSubmit = async (e) => {
    console.log(formData);
    e.preventDefault();

    // Send form data to the API endpoint
    /* The code is making a POST request to the 'http://localhost:8000/register' endpoint with the form
    data stored in the `formData` state variable. */
    const response = await fetch('http://localhost:8000/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    // const data = await response.json()
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
    <div className="form-container">
      <h1 className="title">Admin Registration</h1>
      <form className="form" onSubmit={handleSubmit}>

        <input placeholder='Email:' className='input_text' type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />

        <input placeholder='Name:' className='input_text' type="text" id="Name" name="Name" required />

        <input placeholder='Password:' className='input_text' type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />

        <input placeholder='Club Name:' className='input_text' type="text" id="clubName" name="clubName" required />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AdminRegistration;
