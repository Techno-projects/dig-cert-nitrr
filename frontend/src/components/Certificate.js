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
  const [tempcoords, setTempCoord] = useState({});
  const [widths, setWidths] = useState({});
  const [selectedFont, setSelectedFont] = useState('DancingScript-Medium.ttf');
  const [textColor, setTextColor] = useState('#000000');
  const [tempBox, setTempBox] = useState(null);

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

        const createBox = (id, width = 125, height = 25) => {
          const box = document.createElement("div");
          const title = document.createElement("div");
  
          box.className = "certificateRect";
          box.style.width = `${width}px`;
          box.style.height = `${height}px`;
          box.style.position = "absolute";
          box.style.border = "2px solid red";
          box.style.overflow = "hidden";
          box.id = id;
  
          title.className = "certificateRect";
          title.style.border = "none";
          title.innerHTML = id;
          title.id = id;
  
          return { box, title, startX: null, startY: null };
        };

        tmpFields.forEach((field) => {
          tmp[field] = createBox(field);
        });
        
        faculties.forEach((faculty) => {
          tmp[faculty] = createBox(faculty);
        });

        tmp["cdc"] = createBox("cdc");
        tmp["Serial No"] = createBox("serial");

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
    //this function is not chatgpt-ed if you thought so :)

    console.log(e.clientX, e.clientY)
    console.log(fieldBox);
    if (!selectedField) {
      alert("Please select at least one field");
      return;
    }
    setAsk(true);
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; //relative to image
    const y = e.clientY - rect.top; //relative to image

    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;

    const xInPixels = (x / rect.width) * imageWidth; //scaled, but relative to image, changes for each click
    const yInPixels = (y / rect.height) * imageHeight; //scaled, but relative to image, changes for each click

    if (!tempcoords[selectedField]) {
        tempcoords[selectedField] = { startX: xInPixels, startY: yInPixels }; //temporary, scaled relative to image
        coords[selectedField] = { x: xInPixels, y: yInPixels }; //to be passed on to the body, scaled relative to image

        const guideBox = document.createElement("div");
        guideBox.style.position = "absolute";
        guideBox.style.left = (tempcoords[selectedField].startX/imageWidth)*rect.width+rect.left+window.scrollX + "px";
        guideBox.style.top = (tempcoords[selectedField].startY/imageHeight)*rect.height+rect.top+window.scrollY + "px";
        guideBox.style.border = "2px dashed red";
        guideBox.style.pointerEvents = "none";
        rectRef.current.appendChild(guideBox);
        setTempBox(guideBox);

        function moveHandler(event) {
          const newX = event.clientX - rect.left;
          if (newX < 0 || newX > rect.width) return;
          const newY = event.clientY - rect.top;
          if (newY < 0 || newY > rect.height) return;

          const newWidth = Math.abs(newX - x);
          const newHeight = Math.abs(newY - y);
          guideBox.style.width = newWidth + "px";
          guideBox.style.height = newHeight + "px";
        }

        document.addEventListener("mousemove", moveHandler);
        tempcoords[selectedField].moveHandler = moveHandler;

    } else {
        tempcoords[selectedField].endX = xInPixels; //temporary, scaled and relative to image
        tempcoords[selectedField].endY = yInPixels; //temporary, scaled and relative to image

        const width = Math.abs(tempcoords[selectedField].endX - tempcoords[selectedField].startX); //width scaled relative to image
        const height = Math.abs(tempcoords[selectedField].endY - tempcoords[selectedField].startY); //height scaled relative to image

        const box = fieldBox[selectedField].box;
        const title = fieldBox[selectedField].title;
        title.innerHTML = selectedField;

        const left = (tempcoords[selectedField].startX/imageWidth)*rect.width+rect.left+window.scrollX; //temp, absolute pixels
        const top = (tempcoords[selectedField].endY/imageHeight)*rect.height+rect.top+window.scrollY; //temp, absolute pixels
        
        box.style.left = left + "px";
        box.style.top = top-25 + "px";
        box.style.width = `${width/imageWidth*rect.width}px`; //box width to be stored in absolute pixels
        box.style.height = "25px";
        coords[selectedField].x = coords[selectedField].x + (width-(125/rect.width*imageWidth))/2;
        coords[selectedField].y = yInPixels - (25/rect.height)*imageHeight; 
        widths[selectedField] = width;

        title.style.left = left + "px";
        title.style.top = top - 42 + "px"; //42 is arbitrary value

        rectRef.current.appendChild(box);
        rectRef.current.appendChild(title);

        if (tempBox) {
          tempBox.remove();
          setTempBox(null);
        }

        document.removeEventListener("mousemove", tempcoords[selectedField].moveHandler);
        delete tempcoords[selectedField]; //resetting temporary coordinates every 2nd click
    }
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
    body.append("widths", JSON.stringify(widths));

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
      body.append("widths", JSON.stringify(widths));
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
                <label for="cdc_sign">CDC/DSW Signature</label>
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
              <option value="ChakraPetch-Regular.ttf">ChakraPetch</option>
              <option value="Oxanium-Regular.ttf">Oxanium</option>
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
