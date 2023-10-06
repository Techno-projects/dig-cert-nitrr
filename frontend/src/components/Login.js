import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    console.log(e.target)
    e.preventDefault();

    try{
      const response = await fetch('http://localhost:8000/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    console.log(response);
    if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            // Redirect to the desired page on successful authentication
            window.location.href = '/Event_management';
        } else {
            // Handle authentication failure (display error message, etc.)
            setError('Authentication failed. Please check your username and password.');
        }
    }
    catch{
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <div className="form-container">
      <h1 className="title">Login</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="email">User ID:</label>
        <input type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
        <button type="submit">Submit</button>
      </form>
      <Link to="/register">
        <button className="register-button">Register</button>
      </Link>
    </div>
    {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
    
  );
};

export default Login;