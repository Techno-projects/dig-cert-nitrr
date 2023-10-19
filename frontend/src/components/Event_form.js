import React, { useState } from 'react';
import './css/Form.css';


import axios from 'axios';
const EventForm = () => {
  const [eventData, setEventData] = useState({
    event_name: '',
    description: '',
    facultyAdvisor: '',
    cdcHead: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    // e.preventDefault();
    console.log(eventData);
    const formData = new FormData();
    formData.append('file', selectedFile);
    for (const key in eventData) {
      if (eventData.hasOwnProperty(key)) {
        formData.set(key, eventData[key]);
      }
    }
    const response = await axios.post("http://localhost:8000/api/register_event", formData, {
      headers: {
        "content-type": "multipart/form-data"
      }
    })
    console.log(response);
  };

  return (
    <div>
      <form>
        <div className='form-container'>
        <h1 className='title'>Event Management</h1>

          <input className='input_text' placeholder='Event Name:' type="text" id="event_name" name="event_name" value={eventData.event_name} onChange={handleChange} required />
          <p />


          <input className='input_text' placeholder='Organisation Code:' type="text" id="eventName" name="organisation_code" value={eventData.organisation_code} onChange={handleChange} required />
          <p />

          <input className='input_text' placeholder='Participants' type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" id="participants" onChange={handleFileChange} required />
          <p />

          {/* <label htmlFor="cdcHead">CDC Head:</label>
        <input type="text" id="cdcHead" name="cdcHead" value={eventData.cdcHead} onChange={handleChange} required /> */}
          <button type="button" onClick={handleSubmit}>Submit</button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;

