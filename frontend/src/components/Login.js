import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Faculty_Login from './Faculty_login';
import './css/Form.css';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organisation_code: ''
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
    console.log(e.target)
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/user_login ', {
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
    catch {
      console.error('Error:', error);
    }
  };

  return (
    <>
      {userType == 1 ? <Faculty_Login /> :
        <div>
          {/* <div>
            <a href='?type=faculty'>
              <input type='button' value="Faculty" />
            </a>
          </div> */}
          <div className="form-container">
            <h1 className="title">Login</h1>
            <form className="form" onSubmit={handleSubmit}>

              <input placeholder='User ID:' className='input_text' type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
              
              <input placeholder='Organisation Code:' className='input_text' type="text" id="organisation_code" name="organisation_code" value={formData.organisation_code} onChange={handleInputChange} required />
              
              <input placeholder='Password' className='input_text' type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
              <button type="submit">Submit</button>
            </form>
           
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      }
    </>
  );
};

export default Login;
