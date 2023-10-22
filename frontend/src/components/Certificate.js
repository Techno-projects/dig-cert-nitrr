import React, { useState, useRef, useEffect } from 'react'
import './css/Certificate.css'
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Certificate = () => {
    // const auth = localStorage.getItem('token');
    const location = useLocation();
    const [eventData, setEventData] = useState(location.state);
    const [fields, setFields] = useState([]);
    const [certi, setCerti] = useState();
    const [certificate, setCertificate] = useState(null);
    const imageRef = useRef(null);
    const rectRef = useRef(null);
    const [ask, setAsk] = useState(false);
    const [selectedField, setSelected] = useState(null);

    const [coords, setCoord] = useState({});

    useEffect(() => {
        async function getRows() {
            const formData = new FormData();
            formData.append('file', eventData.file);
            const response = await axios.post("http://localhost:8000/api/get_rows", formData, {
                headers: {
                    "content-type": "multipart/form-data"
                }
            })
            console.log(response.data);
            setFields(response.data.message)
        }
        getRows();
    }, [])

    function handleChange(e) {
        setCerti(URL.createObjectURL(e.target.files[0]));
        setCertificate(e.target.files[0]);
    }

    const removeBox = () => {
        rectRef.current.removeChild(rectRef.current.lastChild);
    }

    function handleClick(e) {
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
        const rectangle = document.createElement("div");
        rectangle.className = "certificateRect";

        // Position the rectangle at the click coordinates
        rectangle.style.left = e.clientX + "px";
        rectangle.style.top = e.clientY + "px";

        // Set the dimensions of the rectangle (for example, 125x25 pixels)
        rectangle.style.width = "125px";
        rectangle.style.height = "25px";

        // Append the rectangle to the container for rectangles
        rectRef.current.appendChild(rectangle);
    }

    const submit = async () => {
        const body = new FormData();
        body.append('event_data', eventData.file);
        body.append('certificate', certificate);
        body.append('coords', JSON.stringify(coords));
        body.append('event', eventData.event);
        body.append('user', eventData.user)

        console.log(coords);

        const response = await axios.post("http://localhost:8000/api/register_event", body, {
            headers: {
                "content-type": "multipart/form-data"
            }
        })
        console.log(response);
    }

    return (
        <div style={{display: 'flex'}}>
            {!certi && <div>
                <div>Upload Your certificate below :</div>
                <input type="file" accept='image/*' onChange={handleChange} />
            </div>}
            <br />
            <img src={certi} ref={imageRef} height={"550px"} style={{ userSelect: "none" }} onClick={handleClick} />
            <div ref={rectRef}></div>
            {/* <button style={{height: "50px"}} onClick={removeBox}>Remove Last</button> */}
            <div>
                Which field?
                <br />
                {fields.map(field => (
                    <>
                        <input type='radio' id={field} name='selection' value={field} onChange={(e) => setSelected(e.target.value)} />
                        <label for={field}>{field}</label><br />
                    </>
                ))}
                <input type='radio' id="faculty_sign" name='selection' value="faculty_sign" onChange={(e) => setSelected(e.target.value)} />
                <label for="faculty_sign">Faculty Signature</label><br />

                <input type='radio' id="cdc_sign" name='selection' value="cdc_sign" onChange={(e) => setSelected(e.target.value)} />
                <label for="cdc_sign">CDC Signature</label><br />
                <br />
                <button onClick={submit}>Submit</button>
            </div>
        </div>
    )
}

export default Certificate;