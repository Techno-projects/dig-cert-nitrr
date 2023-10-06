import React, { useState } from 'react';

const EventForm = ({ onFormSubmit }) => {
  const [eventData, setEventData] = useState({
    eventName: '',
    description: '',
    facultyAdviser: '',
    cdcHead: ''
  });

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(eventData);
    // Optionally, you can clear the form fields after submission
    setEventData({
      eventName: '',
      description: '',
      facultyAdviser: '',
      cdcHead: ''
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="eventName">Event Name:</label>
        <input type="text" id="eventName" name="eventName" value={eventData.eventName} onChange={handleChange} required />
        <label htmlFor="description">Description:</label>
        <textarea id="description" name="description" value={eventData.description} onChange={handleChange} required />
        <label htmlFor="facultyAdviser">Faculty Adviser:</label>
        <input type="text" id="facultyAdviser" name="facultyAdviser" value={eventData.facultyAdviser} onChange={handleChange} required />
        <label htmlFor="cdcHead">CDC Head:</label>
        <input type="text" id="cdcHead" name="cdcHead" value={eventData.cdcHead} onChange={handleChange} required />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default EventForm;

