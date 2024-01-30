import React, { useState } from 'react';
import './css/DashboardAd.css';

const Dashboard_Admin = () => {
    const [name, setName] = useState('');
    const [club, setClub] = useState('');
    const [events, setEvents] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newEvent, setNewEvent] = useState({ name: '', faculty: '', expectedDate: '', status: 'Unsigned' });

    const handleAddEvent = () => {
        for (const key in newEvent) {
            if (!newEvent[key] || newEvent[key] === '') {
                alert(`Please fill out the ${key} fields.`);
            }
        }
        setEvents([...events, newEvent]);
        setNewEvent({ name: '', faculty: '', expectedDate: '', status: 'Unsigned', fileName: `${selectedFile.name}` });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);

    };
    const handleRemoveEvent = (index) => {
        const updatedEvents = [...events];
        updatedEvents.splice(index, 1);
        setEvents(updatedEvents);
    };

    return (
        <div className='entire_container'>
            <div className="dashboard_container">
                <div className="Event_info">
                    <h2>Admin Dashboard</h2>
                    <div>
                        <input
                            className='input_text'
                            type="text"
                            placeholder="Name"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            className='input_text'
                            type="text"
                            placeholder="Club"
                            value={club}
                            required
                            onChange={(e) => setClub(e.target.value)}
                        />
                    </div>
                    <h3>Events:</h3>
                    <div>
                        <form>
                            <input
                                required
                                className='input_text'
                                type="text"
                                placeholder="Event Name"
                                value={newEvent.name}
                                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                            />
                            <input
                                required
                                className='input_text'
                                type="text"
                                placeholder="Faculty"
                                value={newEvent.faculty}
                                onChange={(e) => setNewEvent({ ...newEvent, faculty: e.target.value })}
                            />
                            <input
                                required
                                className='input_text'
                                type="date"
                                placeholder="Expected Date"
                                value={newEvent.expectedDate}
                                onChange={(e) => setNewEvent({ ...newEvent, expectedDate: e.target.value })}
                            />
                            <input
                                required
                                className='input_text'
                                type="file"
                                placeholder="Enter your file"
                                onChange={handleFileChange}
                            />
                            <button onClick={handleAddEvent}>+</button>
                        </form>
                    </div>
                </div>
            </div>
            <div className='List_of_events'>
                <ul>
                    {events.map((event, index) => (
                        <li key={index} className="event-item">
                            <div>{event.name}</div>
                            <div>Faculty: {event.faculty}</div>
                            <div>Expected Date: {event.expectedDate}</div>
                            <div>Status: {event.status}</div>
                            <div>File: {selectedFile && selectedFile.name}</div>
                            <button onClick={() => handleRemoveEvent(index)}>-</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
};

export default Dashboard_Admin;
