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
  const [selectedFont, setSelectedFont] = useState('DancingScript-Medium.ttf');
  const [textColor, setTextColor] = useState('#000000');

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
          // fieldBox[tmp_field] = { box: box, title: title }
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
          // fieldBox[faculty] = { box: box, title: title }
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

  function handleChange(e) {
    setCerti(URL.createObjectURL(e.target.files[0]));
    setCertificate(e.target.files[0]);
  }

  const removeBox = () => {
    rectRef.current.removeChild(rectRef.current.lastChild);
  };

  function handleClick(e) {
    console.log(fieldBox);
    if (!selectedField) {
      alert("Please select at least one field");
      return;
    }
    setAsk(true);
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // console.log(x, y);

    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;

    // Get the displayed size of the image in the viewport
    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;

    // Calculate the coordinates in pixels relative to the image
    const xInPixels = (x / rect.width) * imageWidth;
    const yInPixels = (y / rect.height) * imageHeight;
    // console.log(xInPixels, yInPixels);

    coords[selectedField] = { x: xInPixels, y: yInPixels };

    // Create a new rectangle element
    // const rectangle = document.createElement("div");
    // const title = document.createElement("div");
    // title.innerHTML = selectedField;
    // title.style.border = "none"
    // rectangle.className = "certificateRect";
    // title.className = "certificateRect";

    // Position the rectangle at the click coordinates
    // rectangle.style.left = e.clientX + "px";
    // rectangle.style.top = e.clientY + "px";
    // title.style.left = e.clientX + "px";
    // title.style.top = e.clientY - 21 + "px";

    // Set the dimensions of the rectangle (for example, 125x25 pixels)
    // rectangle.style.width = "125px";
    // rectangle.style.height = "25px";

    const box = fieldBox[selectedField].box;
    const title = fieldBox[selectedField].title;
    title.innerHTML = selectedField;
    box.style.left = e.clientX + window.scrollX + "px";
    box.style.top = e.clientY + window.scrollY + "px";
    title.style.left = e.clientX + window.scrollX + "px";
    title.style.top = e.clientY + window.scrollY - 21 + "px";

    rectRef.current.appendChild(box);
    rectRef.current.appendChild(title);

    // Append the rectangle to the container for rectangles
    // rectRef.current.appendChild(rectangle);
    // rectRef.current.appendChild(title);
  }

  // Add a new preview function in your Certificate component
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
    body.append("font", selectedFont);
    body.append("text_color", textColor);

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
      body.append("font", selectedFont);
      body.append("text_color", textColor);
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
        {/* <button style={{height: "50px"}} onClick={removeBox}>Remove Last</button> */}
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
                <label for={field}>{field}</label>
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
                <label for={faculty}>{faculty} </label>
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
                <label for="cdc_sign">CDC Signature</label>
                <br />
              </>
            )}
            <input
              type="radio"
              name="selection"
              value="Serial No"
              onChange={(e) => setSelected(e.target.value)}
            />
            <label for="Serial No">Serial No.</label>
            <br />
            <button onClick={previewCertificate} className="submit-btn" style={{ marginBottom: "10px" }}>
              Preview
            </button>
            <button onClick={submit} className="submit-btn">
              Submit
            </button>
            <br/>
            <br/>

            <label>Select Font: </label>
            <select 
              value={selectedFont} 
              onChange={(e) => setSelectedFont(e.target.value)}
            >
              <option value="DancingScript-Medium.ttf">Dancing Script</option>
              <option value="arial.ttf">Arial</option>
              <option value="CertificateCondensed-Regular.ttf">CertificateCondensed</option>
              <option value="Italianno-Regular.ttf">Italianno</option>
              <option value="Montserrat-Medium.ttf">Montserrat</option>
              <option value="PinyonScript-Regular.ttf">PinyonScript</option>
              <option value="NotoSans-Regular.ttf">Mangal (Hindi)</option>
              <option value="Kalam-Regular.ttf">Kalam (Hindi)</option>
            </select>
            <br/>

            <label>Text Color: </label>
            <input 
              type="color" 
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              />
            <br/>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
