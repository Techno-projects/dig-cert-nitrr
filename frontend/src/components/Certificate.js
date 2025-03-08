import React, { useState, useRef, useEffect } from "react";
import "./css/Certificate.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import urls from "../urls.json";

const server = urls.SERVER_URL;

const Certificate = () => {
  const auth = localStorage.getItem("login");
  const location = useLocation();
  const eventData = location.state.eventData;
  const faculties = location.state.faculties;
  const dispatch = location.state.dispatch;

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const [fields, setFields] = useState([]);
  const [fieldBox, setFieldBox] = useState({});
  const [certi, setCerti] = useState();
  const [certificate, setCertificate] = useState(null);
  const [ask, setAsk] = useState(false);
  const [selectedField, setSelected] = useState(null);
  const [coords, setCoord] = useState({});
  const [boxSizes, setBoxSizes] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingField, setResizingField] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);

  if (!auth) {
    alert("unauthorized user");
    window.location.href("/");
  }

  useEffect(() => {
    // get headers of event excel file
    async function getRows() {
      const formData = new FormData();
      formData.append("file", eventData.file);
      formData.append("token", auth);
      try {
        const response = await axios.post(`${server}/api/get_rows`, formData, {
          headers: {
            "content-type": "multipart/form-data",
          },
        });
        setFields(response.data.message);
        const tmpFields = response.data.message;
        const tmp = { ...fieldBox };
        const tmpSizes = { ...boxSizes };

        tmpFields.map((tmp_field) => {
          const box = document.createElement("div");
          const title = document.createElement("div");
          const resizer = document.createElement("div");
          box.className = "certificateRect";
          box.style.width = "125px";
          box.style.height = "25px";
          box.id = tmp_field;
          title.className = "certificateRect";
          title.style.border = "none";
          title.innerHTML = tmp_field;
          title.id = tmp_field;
          resizer.className = "resizer";
          resizer.dataset.field = tmp_field;
          box.appendChild(resizer);
          tmp[tmp_field] = { box: box, title: title, resizer: resizer };
          tmpSizes[tmp_field] = { width: 125, height: 25 };
        });

        faculties.map((faculty) => {
          const box = document.createElement("div");
          const title = document.createElement("div");
          const resizer = document.createElement("div");
          box.className = "certificateRect";
          box.style.width = "125px";
          box.style.height = "25px";
          box.id = faculty;
          title.className = "certificateRect";
          title.style.border = "none";
          title.innerHTML = faculty;
          title.id = faculty;
          resizer.className = "resizer";
          resizer.dataset.field = faculty;
          box.appendChild(resizer);
          tmp[faculty] = { box: box, title: title, resizer: resizer };
          tmpSizes[faculty] = { width: 125, height: 25 };
        });

        const box = document.createElement("div");
        const title = document.createElement("div");
        const resizer = document.createElement("div");
        box.className = "certificateRect";
        box.style.width = "125px";
        box.style.height = "25px";
        box.id = "cdc";
        title.className = "certificateRect";
        title.style.border = "none";
        title.innerHTML = "cdc";
        title.id = "cdc";
        resizer.className = "resizer";
        resizer.dataset.field = "cdc";
        box.appendChild(resizer);
        tmp["cdc"] = { box: box, title: title, resizer: resizer };
        tmpSizes["cdc"] = { width: 125, height: 25 };

        const box_serial = document.createElement("div");
        const title_serial = document.createElement("div");
        const resizer_serial = document.createElement("div");
        box_serial.className = "certificateRect";
        box_serial.style.width = "125px";
        box_serial.style.height = "25px";
        box_serial.id = "serial";
        title_serial.className = "certificateRect";
        title_serial.style.border = "none";
        title_serial.innerHTML = "serial";
        title_serial.id = "serial";
        resizer_serial.className = "resizer";
        resizer_serial.dataset.field = "Serial No";
        box_serial.appendChild(resizer_serial);
        tmp["Serial No"] = { box: box_serial, title: title_serial, resizer: resizer_serial };
        tmpSizes["Serial No"] = { width: 125, height: 25 };

        setFieldBox(tmp);
        setBoxSizes(tmpSizes);
      } catch (error) {
        console.log(error);
        alert(error.response.data.message);
        window.location.href = "/";
      }
    }
    getRows();
    
    // Setup event listeners for resizing
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle mouse move for resizing
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newWidth = Math.max(50, initialWidth + dx); // Minimum width of 50px
    const newHeight = Math.max(20, initialHeight + dy); // Minimum height of 20px
    
    // Update the box size in state
    setBoxSizes(prev => ({
      ...prev,
      [resizingField]: { width: newWidth, height: newHeight }
    }));
    
    // Update the box appearance
    if (fieldBox[resizingField]) {
      fieldBox[resizingField].box.style.width = `${newWidth}px`;
      fieldBox[resizingField].box.style.height = `${newHeight}px`;
    }
  };

  // Handle mouse up to end resizing
  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizingField(null);
    }
  };

  // Handle resize start
  const handleResizeStart = (e, field) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizingField(field);
    setStartX(e.clientX);
    setStartY(e.clientY);
    setInitialWidth(boxSizes[field].width);
    setInitialHeight(boxSizes[field].height);
  };

  function handleChange(e) {
    setCerti(URL.createObjectURL(e.target.files[0]));
    setCertificate(e.target.files[0]);
  }

  const removeBox = () => {
    rectRef.current.removeChild(rectRef.current.lastChild);
  };

  function handleClick(e) {
    if (!selectedField) {
      alert("Please select at least one field");
      return;
    }
    setAsk(true);
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;

    // Get the displayed size of the image in the viewport
    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;

    // Calculate the coordinates in pixels relative to the image
    const xInPixels = (x / rect.width) * imageWidth;
    const yInPixels = (y / rect.height) * imageHeight;

    coords[selectedField] = { x: xInPixels, y: yInPixels };
    setCoord({...coords});

    const box = fieldBox[selectedField].box;
    const title = fieldBox[selectedField].title;
    const resizer = fieldBox[selectedField].resizer;
    
    title.innerHTML = selectedField;
    box.style.left = e.clientX + window.scrollX + "px";
    box.style.top = e.clientY + window.scrollY + "px";
    title.style.left = e.clientX + window.scrollX + "px";
    title.style.top = e.clientY + window.scrollY - 21 + "px";
    
    // Add resize handler
    resizer.onmousedown = (e) => handleResizeStart(e, selectedField);

    rectRef.current.appendChild(box);
    rectRef.current.appendChild(title);
  }

  const previewCertificate = async () => {
    const body = new FormData();
    if (
      Object.keys(coords).length === 0 ||
      certificate === null ||
      eventData.file === null
    ) {
      alert("Please place all required fields on the certificate first");
      return;
    }

    body.append("event_data", eventData.file);
    body.append("certificate", certificate);
    body.append("coords", JSON.stringify(coords));
    body.append("box_sizes", JSON.stringify(boxSizes));
    body.append("token", auth);

    try {
      const response = await axios.post(`${server}/api/preview_certificate`, body, {
        headers: {
          "content-type": "multipart/form-data",
        },
        responseType: 'blob', // Important: we want to receive a blob
      });
      
      // Create a URL for the blob
      const previewUrl = URL.createObjectURL(response.data);
      
      // Update the certificate image with the preview
      setCerti(previewUrl);
      
      // Show a temporary notification that this is a preview
      alert("This is a preview. Click Submit when you're satisfied with the placement.");
    } catch (error) {
      alert("Error generating preview: " + (error.response?.data?.message || error.message));
    }
  };

  const submit = async () => {
    const body = new FormData();
    const keys = Object.keys(coords);
    if (
      eventData.file !== null &&
      certificate !== null &&
      eventData.event !== null &&
      eventData.user !== null &&
      auth !== null
    ) {
      let required_faculties = [];
      body.append("event_data", eventData.file);
      body.append("certificate", certificate);
      body.append("coords", JSON.stringify(coords));
      body.append("box_sizes", JSON.stringify(boxSizes));
      body.append("event", eventData.event);
      body.append("user", eventData.user);
      body.append("token", auth);
      body.append("cdc", eventData.cdc);
      body.append("dispatch", dispatch);
      Object.keys(coords).map((key) => {
        if (faculties.includes(key)) {
          required_faculties.push(key);
        }
      });
      body.append("faculties", JSON.stringify(required_faculties));
    } else {
      alert("Looks like some fields are missing");
      return;
    }

    try {
      const response = await axios.post(`${server}/api/register_event`, body, {
        headers: {
          "content-type": "multipart/form-data",
        },
      });
      alert(response.data.message);
      window.location.href = "/Event_management";
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", margin: "10%" }}>
        {!certi && (
          <div className="Certificate_box">
            <div className="Certificate_heading">
              Upload Your certificate below :
            </div>
            <input
              className="Certificate_file"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
        )}
        <br />
        <img
          src={certi}
          ref={imageRef}
          height={"550px"}
          style={{ userSelect: "none" }}
          onClick={handleClick}
        />
        <div ref={rectRef}></div>
        {certi && (
          <div className="Certificate_fields">
            Which field?
            <br />
            {fields.map((field) => (
              <>
                <input
                  type="radio"
                  name="selection"
                  value={field}
                  onChange={(e) => setSelected(e.target.value)}
                />
                <label htmlFor={field}>{field}</label>
                <br />
              </>
            ))}
            {faculties.map((faculty) => (
              <>
                <input
                  type="radio"
                  name="selection"
                  value={faculty}
                  onChange={(e) => setSelected(e.target.value)}
                />
                <label htmlFor={faculty}>{faculty} </label>
                <br />
              </>
            ))}
            {eventData.cdc && (
              <>
                <input
                  type="radio"
                  name="selection"
                  value="cdc"
                  onChange={(e) => setSelected(e.target.value)}
                />
                <label htmlFor="cdc_sign">CDC Signature</label>
                <br />
              </>
            )}
            <input
              type="radio"
              name="selection"
              value="Serial No"
              onChange={(e) => setSelected(e.target.value)}
            />
            <label htmlFor="Serial No">Serial No.</label>
            <br />
            <div style={{ marginTop: "10px", marginBottom: "5px" }}>
              <small>To resize a field, drag the bottom-right corner after placing it.</small>
            </div>
            <button onClick={previewCertificate} className="submit-btn" style={{ marginBottom: "10px" }}>
              Preview
            </button>
            <button onClick={submit} className="submit-btn">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;