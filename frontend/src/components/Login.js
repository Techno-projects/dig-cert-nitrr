import React, { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Faculty_Login from './Faculty_login';
import AuthContext from '../context/AuthContext';
import './css/Form.css';

const Login = () => {
  // let { name } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      console.log(response);
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = '/event_management';
      } else {
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
          <div className="form-container" id='default'>
            <h1 className="title">Login</h1>
            <form className="form" onSubmit={handleSubmit}>

              <input placeholder='Email ID' className='input_text' type="text" id="email" name="email" value={formData.email} onChange={handleInputChange} required />

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
