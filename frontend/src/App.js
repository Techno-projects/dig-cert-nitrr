import React from 'react';
import { BrowserRouter as Router, Route, Link, BrowserRouter, Routes } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Registration';
import AdminRegistration from './components/Admin_of_club';
import EventManagementPage from './components/Event_manager';
import FacultyRegistration from './components/Faculty';
import Events from './components/Events';
import HomePage from './components/HomePage';
import Dashboard_Admin from './components/Dashboard_Admin';
import Certificate from './components/Certificate';
// import './App.css';
import PrivateRoute from './utils/PrivateRoute';
import Table from './components/Table';

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
        <Route path='/DashboardAd' element={<Dashboard_Admin/>}/>
        <Route path='/Certificate' element={<Certificate/>}/>
        <Route path='/table' element={<Table/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
