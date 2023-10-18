import React,{ useState,useRef } from 'react'
import './css/Certificate.css'

const Certificate = () => {
    const [file, setFile] = useState();
    const imageRef = useRef(null);
    const rectRef = useRef(null);

    function handleChange(e) {
        console.log(e.target.files);
        setFile(URL.createObjectURL(e.target.files[0]));
    }

    const removeBox = ()=>{
        rectRef.current.removeChild(rectRef.current.lastChild);
    }

    function handleClick(e) {
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(x,y);

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

  return (
    <div>
        {!file && <div>
            <div>Upload Your certificate below :</div>
            <input type="file" onChange={handleChange} />
        </div>}
        <img src={file} ref={imageRef} height={"550px"} style={{userSelect:"none"}} onClick={handleClick}/>
        <div ref={rectRef}></div>
        <button onClick={removeBox}>Remove Last</button>
    </div>
  )
}

export default Certificate;