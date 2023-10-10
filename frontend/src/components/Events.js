import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
// import Compressor from 'image-compressor';
// import canvasToBlob from 'blueimp-canvas-to-blob';
import imageCompression from 'browser-image-compression';

const Events = () => {
  const location = useLocation();
  const [events, setEvents] = useState(location.state.event_data);
  const [email, setEmail] = useState(location.state.email);
  const [event_data, setEventData] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const [event_name, setEventName] = useState(null);


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

  const approveL0 = async () => {
    // write logic to add image to certificate and store certificate in DB
    const response = await fetch('http://localhost:8000/api/approveL0', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({"event_name": event_name, "event_data": event_data, "faculty_mail": email})
    });

    const data = await response.json();
    if (data.ok) {
      alert(data.message);
    }
  }

  const showEventData = () => {
    const DisplayData = event_data.map(
      info => {
        return (
          <tr>
            <td>{info.Name}</td>
            <td>{info.Email}</td>
          </tr>
        )
      }
    )
    return (
      <div>
        {clicked ? <><table class="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {DisplayData}
          </tbody>
        </table>
        <button onClick={approveL0}>Approve All</button>
        </>
          :
          <></>}
      </div>
    )
  }
  return (
    <>
      <div>
        <div>
            Upload Signature
            <br/>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>
      </div>
      <div className="events" style={{ display: 'flex', justifyContent: 'space-between', margin: "10px" }}>

        {events.map(event => {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: "10px", cursor: "pointer" }}>
              <button onClick={() => {
                setEventName(event.event_name)
                setEventData(JSON.parse(event.data))
                setClicked(true)
              }}>
                {event.event_name}
              </button>
            </div>
          );
        })}
      </div>
      <p></p>
      <div>
        {showEventData()}
      </div>
    </>
  );
}

export default Events;