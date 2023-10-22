import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import Compressor from 'image-compressor';
// import canvasToBlob from 'blueimp-canvas-to-blob';
import imageCompression from 'browser-image-compression';

const Events = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState(location.state.pending);
  const [event_data, setEventData] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const [event_name, setEventName] = useState(null);
  const [selected_org, setSelectedOrg] = useState(null);
  const org_names = Object.keys(events);


  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadButtonStyle = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '10px',
    textAlign: 'center',
    cursor: 'pointer',
  };

  const handleImageChange = async (e) => {
    const selectedImage = e.target.files[0];

    if (selectedImage) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      try {
        const compressedFile = await imageCompression(selectedImage, options);
        const base64String = await convertFileToBase64(compressedFile);
        localStorage.setItem("signature", base64String);
        setImageBase64(base64String);
      } catch (error) {
        console.log(error);
      }
    }
  }

  // const approveL0 = async () => {
  //   // write logic to add image to certificate and store certificate in DB
  //   const response = await fetch('http://localhost:8000/api/approveL0', {
  //     method: "POST",
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({"event_name": event_name, "event_data": event_data, "faculty_mail": email})
  //   });

  //   const data = await response.json();
  //   if (data.ok) {
  //     alert(data.message);
  //   }
  // }

  const loadData = (org_name) => {
    setSelectedOrg(org_name);
    setEventData(events[org_name]);
  }
  const seeTable = (rows, event_name) => {
    navigate('/table', {
      state: {pending: rows, event_name: event_name, org_name: selected_org}
    })
  }

  return (
    <>
      {/* <div>
        <div>
            Upload Signature
            <br/>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>
      </div> */}

      <div style={{ display: 'flex' }}>
        {org_names.map(org_name => (
          <div style={{ width: "100px", backgroundColor: 'aliceblue', border: "2px solid black", marginLeft: '20px', cursor: 'pointer' }} onClick={() => loadData(org_name)}>
            {org_name}
          </div>
        ))}
      </div>
      <p></p>
      <div>
        {event_data.map(event => {
          return (
            <div style={{cursor: 'pointer'}} onClick={() => seeTable(event[Object.keys(event)[0]], Object.keys(event)[0], )}>
              Event Name: {Object.keys(event)[0]}
            </div>
          )
        })}
      </div>
    </>
  );
}

export default Events;