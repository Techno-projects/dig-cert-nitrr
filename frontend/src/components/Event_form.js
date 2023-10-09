import React, { useState } from 'react';
import axios from 'axios';
const EventForm = () => {
  const [eventData, setEventData] = useState({
    event_name: '',
    organisation_code: '',
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
    const response = await axios.post("http://localhost/api/register_event", formData, {
      headers: {
        "content-type": "multipart/form-data"
      }
    })
    console.log(response);
    // console.log(formData);
  };

  return (
    <div>
      <form>
        <label htmlFor="event_name">Event Name:</label>
        <input type="text" id="event_name" name="event_name" value={eventData.event_name} onChange={handleChange} required />
        <p />

        <label htmlFor="organisation_code">Organisation Code:</label>
        <input type="text" id="eventName" name="organisation_code" value={eventData.organisation_code} onChange={handleChange} required />
        <p />

        <label htmlFor="participants">Participants:</label>
        <input type="file" id="participants" onChange={handleFileChange} required />
        <p />

        {/* <label htmlFor="cdcHead">CDC Head:</label>
        <input type="text" id="cdcHead" name="cdcHead" value={eventData.cdcHead} onChange={handleChange} required /> */}
        <button type="button" onClick={handleSubmit}>Submit</button>
      </form>
    </div>
  );
};

export default EventForm;

