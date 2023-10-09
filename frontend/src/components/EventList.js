import React, { useState } from "react";

const EventList = ({ events }) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);

  const handleEventClick = (index) => {
    if (index === selectedEventIndex) {
      // If the same event is clicked again, collapse it
      setSelectedEventIndex(null);
    } else {
      // If a different event is clicked, expand it
      setSelectedEventIndex(index);
    }
  };

  return (
    <div className="event-list">
      {events.map((event, index) => (
        <div className="event-card" key={index}>
          <div className="event-name" onClick={() => handleEventClick(index)}>
            {event.event_name}
          </div>
          {selectedEventIndex === index && (
            <div className="event-description">
              <h2>Event Details</h2>
              {event.data.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <strong>Name:</strong> {item.Name}, <strong>Email:</strong>{" "}
                  {item.Email}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;
