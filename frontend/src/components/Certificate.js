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
  const [fontSize, setFontSize] = useState(16);
  const [boxWidth, setBoxWidth] = useState(125);
  const [boxHeight, setBoxHeight] = useState(25);

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

        tmpFields.map((tmp_field) => {
          const box = document.createElement("div");
          const title = document.createElement("div");
          box.className = "certificateRect";
          box.style.width = "125px";
          box.style.height = "25px";
          box.id = tmp_field;
          title.className = "certificateRect";
          title.style.border = "none";
          title.innerHTML = tmp_field;
          title.id = tmp_field;
          tmp[tmp_field] = { box: box, title: title };
        });
        faculties.map((faculty) => {
          const box = document.createElement("div");
          const title = document.createElement("div");
          box.className = "certificateRect";
          box.style.width = "125px";
          box.style.height = "25px";
          box.id = faculty;
          title.className = "certificateRect";
          title.style.border = "none";
          title.innerHTML = faculty;
          title.id = faculty;
          tmp[faculty] = { box: box, title: title };
        });
        const box = document.createElement("div");
        const title = document.createElement("div");
        box.className = "certificateRect";
        box.style.width = "125px";
        box.style.height = "25px";
        box.id = "cdc";
        title.className = "certificateRect";
        title.style.border = "none";
        title.innerHTML = "cdc";
        title.id = "cdc";
        tmp["cdc"] = { box: box, title: title };

        const box_serial = document.createElement("div");
        const title_serial = document.createElement("div");
        box_serial.className = "certificateRect";
        box_serial.style.width = "125px";
        box_serial.style.height = "25px";
        box_serial.id = "serial";
        title_serial.className = "certificateRect";
        title_serial.style.border = "none";
        title_serial.innerHTML = "serial";
        title_serial.id = "serial";
        tmp["Serial No"] = { box: box_serial, title: title_serial };

        setFieldBox(tmp);
      } catch (error) {
        console.log(error);
        alert(error.response.data.message);
        window.location.href = "/";
      }
    }
    getRows();
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (image) {
      image.addEventListener('dragstart', (e) => e.preventDefault());
    }
  }, [certi]);

  function handleChange(e) {
    setCerti(URL.createObjectURL(e.target.files[0]));
    setCertificate(e.target.files[0]);
  }

  const handleBoxWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    setBoxWidth(newWidth);
    
    if (selectedField && fieldBox[selectedField]) {
      const box = fieldBox[selectedField].box;
      box.style.width = `${newWidth}px`;
      
      if (coords[selectedField]) {
        coords[selectedField].width = newWidth;
        setCoord({...coords});
      }
    }
  };

  const handleBoxHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    setBoxHeight(newHeight);
    
    if (selectedField && fieldBox[selectedField]) {
      const box = fieldBox[selectedField].box;
      box.style.height = `${newHeight}px`;
      
      if (coords[selectedField]) {
        coords[selectedField].height = newHeight;
        setCoord({...coords});
      }
    }
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFontSize(newSize);
    
    if (selectedField && fieldBox[selectedField]) {
      const box = fieldBox[selectedField].box;
      box.style.fontSize = `${newSize}px`;
      
      if (coords[selectedField]) {
        coords[selectedField].fontSize = newSize;
        setCoord({...coords});
      }
    }
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

    const xInPixels = (x / rect.width) * imageWidth;
    const yInPixels = (y / rect.height) * imageHeight;

    coords[selectedField] = { 
      x: xInPixels, 
      y: yInPixels,
      width: boxWidth,
      height: boxHeight,
      fontSize: fontSize 
    };
    setCoord({...coords});

    const box = fieldBox[selectedField].box;
    const title = fieldBox[selectedField].title;
    
    while (box.firstChild) {
      box.removeChild(box.firstChild);
    }
    
    const textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.textContent = selectedField;
    box.appendChild(textContent);

    box.style.left = e.clientX + window.scrollX + "px";
    box.style.top = e.clientY + window.scrollY + "px";
    box.style.width = boxWidth + "px";
    box.style.height = boxHeight + "px";
    box.style.fontSize = `${fontSize}px`;
    box.style.position = 'absolute';
    box.style.border = '2px dashed #666';
    box.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.userSelect = 'none';

    title.style.left = e.clientX + window.scrollX + "px";
    title.style.top = e.clientY + window.scrollY - 21 + "px";

    if (!rectRef.current.contains(box)) {
      rectRef.current.appendChild(box);
    }
    if (!rectRef.current.contains(title)) {
      rectRef.current.appendChild(title);
    }
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
    body.append("token", auth);
    body.append("rel_width", 125 / imageRef.current.naturalWidth);
    body.append("rel_height", 25 / imageRef.current.naturalHeight);

    try {
      const response = await axios.post(`${server}/api/preview_event_certificate`, body, {
        headers: {
          "content-type": "multipart/form-data",
        },
        responseType: 'blob', // Important: we want to receive a blob
      });
      
      const previewUrl = URL.createObjectURL(response.data);
      
      setCerti(previewUrl);
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
      body.append("event", eventData.event);
      body.append("user", eventData.user);
      body.append("token", auth);
      body.append("cdc", eventData.cdc);
      body.append("dispatch", dispatch);
      body.append("rel_width", 125 / imageRef.current.naturalWidth);
      body.append("rel_height", 25 / imageRef.current.naturalHeight);
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
            <select onChange={(e) => setSelected(e.target.value)} value={selectedField || ""}>
              <option value="">Select Field</option>
              {fields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
              {faculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
              {eventData.cdc && (
                <option value="cdc">CDC Signature</option>
              )}
              <option value="Serial No">Serial No</option>
            </select>

            <div className="dimension-controls">
              <div className="control-group">
                <label>Width: {boxWidth}px</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={boxWidth}
                  onChange={handleBoxWidthChange}
                />
              </div>
              
              <div className="control-group">
                <label>Height: {boxHeight}px</label>
                <input
                  type="range"
                  min="25"
                  max="200"
                  value={boxHeight}
                  onChange={handleBoxHeightChange}
                />
              </div>

              <div className="control-group">
                <label>Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={handleFontSizeChange}
                />
              </div>
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
