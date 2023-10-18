import React from 'react';
import { BrowserRouter as Router, Route, Link, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Registration';
import AdminRegistration from './components/Admin_of_club';
import EventManagementPage from './components/event_manager';
import FacultyRegistration from './components/Faculty';
import Events from './components/Events';
import './App.css';
import PrivateRoute from './utils/PrivateRoute';

const App = () => {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/events"
              element={
                <PrivateRoute>
                  <Events />
                </PrivateRoute>
              } />
            <Route path="/register" element={<Register />} />
            <Route path='/register/faculty' element={<FacultyRegistration />}></Route>
            <Route path='/register/admin' element={<AdminRegistration />}></Route>
            <Route path='/Event_management' element={<EventManagementPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
};

export default App;
