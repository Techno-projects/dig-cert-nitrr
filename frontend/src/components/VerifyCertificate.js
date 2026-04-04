import { useState } from "react";
import axios from "axios";
import urls from "../urls.json";
import "./css/VerifyCertificate.css";
import toast from "react-hot-toast";
import { Spinner } from "./Spinner";

const server = urls.SERVER_URL;

const VerifyCertificate = () => {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleSerialChange = (event) => {
    setSerial(event.target.value);
  };

  const handleVerifyCertificate = async () => {
    if (!serial.trim()) {
      toast.error("Please enter a serial/dispatch number");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${server}/api/get_certificate?serial=${serial}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
      toast.success("Certificate verified successfully!");
    } catch (error) {
      setLoaded(false);
      setImageSrc(null);
      toast.error("Certificate not found or not yet verified");
    } finally {
      setLoading(false);
      setLoaded(true);
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
      toast.success("Certificate downloaded!");
    } catch (error) {
      toast.error("Certificate could not be downloaded");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {loading && <Spinner message="Verifying certificate..." />}
      <div>
        <center>
          <h1 style={{ color: "white", fontFamily: "Electrolize, sans-serif" }}>
            Enter dispatch number to verify certificate
          </h1>
          <input
            type="text"
            placeholder="Enter Serial Number"
            value={serial}
            onChange={handleSerialChange}
            style={{ marginBottom: "10px" }}
          />
          <button
            onClick={handleVerifyCertificate}
            disabled={loading}
            className="VerifyButton"
          >
            {loading ? "Verifying..." : "Get Certificate"}
          </button>
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
          {imageSrc && loaded && (
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
                className="VerifyButton"
                style={{ marginTop: "20px" }}
                disabled={downloading}
              >
                {downloading ? "Downloading..." : "Download"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
