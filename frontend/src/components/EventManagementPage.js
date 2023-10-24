import React, { useEffect, useRef, useState } from 'react';
import EventForm from './Event_form';
import { useLocation, useNavigate } from "react-router-dom";
import { decodeToken } from "react-jwt";
import axios from 'axios';
import './css/Form.css';

const EventManagementPage = () => {
  const auth = localStorage.getItem('login');
  const user = decodeToken(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    user: user.email,
    file: null,
    event: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fields, setFields] = useState({});

  useEffect(() => {
    if (!auth || !user) {
      window.location.href = "/";
    }
  })

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const [certi, setFile] = useState();
  const imageRef = useRef(null);
  const rectRef = useRef(null);

  const upload = () => {
    if (eventData.event !== "" && selectedFile !== null) {
      eventData.file = selectedFile;
      navigate('/certificate', {
        state: eventData
      })
    }
    else {
      alert("Please fill all the data")
    }
  }

  const handleSubmit = async (e) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user', eventData.user);
    formData.append('event', eventData.event);
    formData.append('token', auth)

    const response = await axios.post("http://localhost:8000/api/register_event", formData, {
      headers: {
        "content-type": "multipart/form-data"
      }
    })
    console.log(response);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <form>
        <div className='form-container'>
          <div className='form-internal'>
            <h1 className='title'>Event Management</h1>

            <input className='input_text' placeholder='Event Name:' type="text" id="event_name" name="event" value={eventData.event} onChange={handleChange} required />
            <p />

            <input className='input_text' placeholder='Participants' type="file" id="participants" onChange={handleFileChange} required />
            <p />


            {/* <label htmlFor="cdcHead">CDC Head:</label>
        <input type="text" id="cdcHead" name="cdcHead" value={eventData.cdcHead} onChange={handleChange} required /> */}
            <button type="button" onClick={upload}>Upload Certificate</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventManagementPage;
