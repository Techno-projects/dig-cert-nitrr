import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
// import { saveAs } from 'file-saver';
// import jsPDF from 'jspdf';
import urls from '../urls.json';

const server = urls.SERVER_URL;

const GetCertificate = () => {
  const [certificate, setCertificate] = useState("");
  const searchParams = new URLSearchParams(window.location.search);
  const searchParamsString = searchParams.toString();
  const navigate = useNavigate();
  const serial = searchParams.get("serial");
  // const [pdfGenerated, setPdfGenerated] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    if (!serial) {
      navigate("/event_management")
    }
    getCertificate();
  }, [searchParamsString]);

  const getCertificate = async () => {
    try {
      const res = await axios.get(`${server}/api/get_certificate?serial=${serial}`, { responseType: "arraybuffer" } );
      const blob = new Blob([res.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
      // setBase64Image(`data:application/png;base64,${res.data.certificate}`)
    }
    catch (error) {
      // console.log(error);
      alert("Certificate not found");
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <center>
        <h1>
          Verified Certificate
        </h1>
        </center>
        <div style={{ height: '60vh', width: '60vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {imageSrc && <img src={imageSrc} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
        </div>
      </div>
    </div>
  )
  
}

export default GetCertificate;