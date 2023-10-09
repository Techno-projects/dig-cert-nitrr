// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Link, BrowserRouter, Routes } from 'react-router-dom';
import AdminRegistration from './components/Admin_Registration';
import EventManagementPage from './components/event_manager';
import FacultyRegistration from './components/Faculty_Registration';
import Home from './components/Home'
import FacultyLogin from './components/Faculty_Login'
import AdminLogin from './components/Admin_Login';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes> 
        <Route path="/" element={<Home/>} />
        <Route path='/login/faculty' element={<FacultyLogin/>}></Route>
        <Route path='/login/admin' element={<AdminLogin/>}></Route>
        <Route path='/register/faculty' element={<FacultyRegistration/>}></Route>
        <Route path='/register/admin' element={<AdminRegistration/>}></Route>
        <Route path='/Event_management' element={<EventManagementPage/>}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
