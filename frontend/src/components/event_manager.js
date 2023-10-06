import React from 'react';
import EventForm from './Event_form';

const EventManagementPage = () => {
  const handleFormSubmit = async (formData) => {
    // Send formData to your API endpoint using fetch or Axios
    // Example using fetch:
    await fetch('https://example.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Event data sent successfully:', data);
        // Optionally, you can redirect the user or show a success message
      })
      .catch(error => {
        console.error('Error sending event data:', error);
        // Handle errors (show error message to the user, etc.)
      });
  };

  return (
    <div>
      <h1>Event Management</h1>
      <EventForm onFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default EventManagementPage;
