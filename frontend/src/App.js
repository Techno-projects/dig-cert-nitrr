// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Link, BrowserRouter, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Registration';
import AdminRegistration from './components/Admin_of_club';
import EventManagementPage from './components/event_manager';
import FacultyRegistration from './components/Faculty';
import Events from './components/Events';
import HomePage from './components/HomePage';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes> 
        <Route path="/" element={<HomePage/>}/>
        <Route path="/Login" element={<Login/>} />
        <Route path="/events" element={<Events />} />
        <Route path="/register" element={<Register/>} />
        <Route path='/register/faculty' element={<FacultyRegistration/>}></Route>
        <Route path='/register/admin' element={<AdminRegistration/>}></Route>
        <Route path='/Event_management' element={<EventManagementPage/>}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
