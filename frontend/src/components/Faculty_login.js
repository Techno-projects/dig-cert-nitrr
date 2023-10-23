import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import './css/Faculty_login.css';

const Faculty_Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/faculty_login ', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          navigate("/table", {
            state: {email: formData.email},
          });
        }
        localStorage.setItem('login', data.token);
        // localStorage.setItem('refreshToken', data.refresh);
        // Redirect to the desired page on successful authentication
        // window.location.href = '/Event_management';
      } else {
        // Handle authentication failure (display error message, etc.)
        setError('Authentication failed. Please check your username and password.');
      }
    }
    catch {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <div className="form-container">
        <h1 className="title">Login</h1>

        <form className="form" onSubmit={handleSubmit}>

          <input placeholder='User ID:' className='input_text' type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />

          <input placeholder='Password:' className='input_text' type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />

          <button type="submit">Submit</button>

        </form>
        {/* <Link to="/register">
          <button className="register-button">Register</button>
        </Link> */}
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>

  );
};

export default Faculty_Login;
