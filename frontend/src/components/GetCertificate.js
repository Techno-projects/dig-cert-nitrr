import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/GetCertificate.css";
// import { saveAs } from 'file-saver';
// import jsPDF from 'jspdf';
import urls from "../urls.json";

const server = urls.SERVER_URL;

const GetCertificate = () => {
  const [certificate, setCertificate] = useState("");
  const [downloading, setDownloading] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const searchParamsString = searchParams.toString();
  const navigate = useNavigate();
  const serial = searchParams.get("serial");
  // const [pdfGenerated, setPdfGenerated] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!serial) {
      navigate("/event_management");
    }
    getCertificate();
  }, [searchParamsString]);

  const getCertificate = async () => {
    try {
      const res = await axios.get(
        `${server}/api/get_certificate?serial=${serial}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
      // setBase64Image(`data:application/png;base64,${res.data.certificate}`)
    } catch (error) {
      // console.log(error);
      alert("Certificate not found");
    }
  };

  const handlePreview = async () => {
    try {
      const res = await axios.get(
        `${server}/api/preview_certificate?serial=${serial}`
      );
      setPreviewImage(`data:image/png;base64,${res.data.image}`);
    } catch (error) {
      alert("Failed to load preview");
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(
        `${server}/api/get_certificate?serial=${serial}&download=true`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${serial}.png`);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      alert("Certificate could not be downloaded");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div>
        <center>
          <h1 style={{ color: "white", fontFamily: "Electrolize, sans-serif" }}>
            Verified Certificate
          </h1>
        </center>
        <div
          style={{
            height: "60vh",
            width: "60vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "50px",
          }}
        >
          {imageSrc && !previewImage  && (
            <>
              <img
                src={imageSrc}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
              <button
                onClick={handleDownload}
                className="GetCertificateButton"
                style={{ marginTop: "20px" }}
              >
                {downloading ? "Downloading..." : "Download"}
              </button>
            </>
          )}

          {/* {!previewImage && (
            <button
              onClick={handlePreview}
              className="GetCertificateButton"
              style={{ marginTop: "20px" }}
            >
              Preview Certificate
            </button>
          )} */}

          {/* {previewImage && (
            <div>
              <img
                src={previewImage}
                alt="Certificate Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default GetCertificate;
