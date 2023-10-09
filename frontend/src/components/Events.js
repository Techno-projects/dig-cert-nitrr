import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EventList from "./EventList";

const Events = () => {
  const location = useLocation();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (location.state && location.state.length > 0) {
      const parsedEvents = location.state.map((event) => ({
        event_name: event.event_name,
        data: JSON.parse(event.data.replace(/^"|"$/g, '').replace(/\\"/g, '"')), // Parse the data property to convert it into a JSON array
      }));
      setEvents(parsedEvents);
    }
  }, [location.state]);

  return (
    <div className="App">
      <h1>Event List</h1>
      <EventList events={events} />
    </div>
  );
};

export default Events;
