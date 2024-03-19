import { useState } from "react";
import axios from 'axios';
// import { saveAs } from 'file-saver';
// import jsPDF from 'jspdf';
import urls from '../urls.json';
import './css/VerifyCertificate.css';
const server = urls.SERVER_URL;

const VerifyCertificate = () => {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  // const [pdfGenerated, setPdfGenerated] = useState(false);
//   const [base64Image, setBase64Image] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  
  const handleSerialChange = (event) => {
    setSerial(event.target.value);
  }

  const handleVerifyCertificate = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${server}/api/get_certificate?serial=${serial}`, { responseType: "arraybuffer" } );
      const blob = new Blob([res.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
    //   setBase64Image(`data:application/png;base64,${res.data.certificate}`);
    }
    catch (error) {
      alert("Certificate not found");
    }
    finally {
      setLoading(false);
    } 
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <center>
        
          <h1 style={{color: 'white', fontFamily: "Electrolize, sans-serif" }}>
            Enter dispatch number to verify certificate
          </h1>
          <input
            type="text"
            placeholder="Enter Serial Number"
            value={serial}
            onChange={handleSerialChange}
            style={{ marginBottom: '10px' }}
          />
          <button onClick={handleVerifyCertificate} disabled={loading} className="handleVerifyButton">
            {loading ? 'Loading...' : 'Get Certificate'}
          </button>
        </center>
        <div style={{ height: '60vh', width: '60vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {imageSrc && <img src={imageSrc} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
        </div>
      </div>
    </div>
  )
  
}

export default VerifyCertificate;