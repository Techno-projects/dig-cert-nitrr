import React, { useEffect, useRef, useState } from 'react';
import EventForm from './Event_form';
import { useLocation, useNavigate } from "react-router-dom";
import { decodeToken } from "react-jwt";
import axios from 'axios';
import './css/Form.css';

const EventManagementPage = () => {
  const auth = localStorage.getItem('login');
  const user = decodeToken(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    user: user.email,
    file: null,
    event: '',
    cdc: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fields, setFields] = useState({});
  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState({});
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    if (!auth || !user) {
      window.location.href = "/";
    }
    const get_orgs = async () => {
      try {
        const response = await axios.post("http://localhost:8000/api/get_all_org", { token: auth }, {
          headers: {
            'Content-type': 'application/json'
          },
        });
        setPartners(response.data.message);
      }
      catch (error) {
        alert(error.response.data.message);
        window.location.reload();
      }
    }
    get_orgs();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.name === "cdc") {
      setEventData({ ...eventData, cdc: !eventData.cdc });
    }
    else {
      setEventData({ ...eventData, [e.target.name]: e.target.value });
    }
  };

  const handlePartners = (e) => {
    const tmp = { ...selectedPartners };
    tmp[e.target.value] = e.target.checked;
    setSelectedPartners(tmp);
  }

  const [certi, setFile] = useState();
  const imageRef = useRef(null);
  const rectRef = useRef(null);

  const upload = async () => {
    if (eventData.event !== "" && selectedFile !== null) {
      eventData.file = selectedFile;

      const tmpBody = { partners: selectedPartners, token: auth };
      try {
        const response = await axios.post("http://localhost:8000/api/get_faculties", tmpBody, {
          headers: {
            "Content-type": 'application/json'
          }
        });
        navigate('/certificate', {
          state: { eventData: eventData, faculties: response.data.message }
        })
      }
      catch (error) {
        alert(error.response.data.message);
        window.location.href = "/event_management";
      }
    }
    else {
      alert("Please fill all the data")
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <form>
        <div className='form-container'>
          <div className='form-internal' style={{ margin: '4rem' }}>
            <h1 className='title'>Event Management</h1>

            <input className='input_text' placeholder='Event Name:' type="text" id="event_name" name="event" value={eventData.event} onChange={handleChange} required />
            <p />

            <input className='input_text' placeholder='Participants' type="file" id="participants" onChange={handleFileChange} required />
            <p />
            <div className='input_class'>
            <input type='checkbox'style={{display:'inline-block',verticalAlign:'top',width:'14px',height:'14px'}} name='cdc' checked={eventData.cdc} onChange={handleChange} /> CDC Signature Required?
            <p />
            </div>
            <label for="partners">Partner Organisation:</label>

            {partners.map(partner => (
              <>
                <input type='checkbox' value={partner} onChange={handlePartners} /> {partner}
              </>
            ))}
            {/* <label htmlFor="cdcHead">CDC Head:</label>
        <input type="text" id="cdcHead" name="cdcHead" value={eventData.cdcHead} onChange={handleChange} required /> */}
            <button type="button" onClick={upload}>Upload Certificate</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventManagementPage;
