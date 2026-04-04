import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./css/GetCertificate.css";
import urls from "../urls.json";
import toast from "react-hot-toast";
import { Spinner } from "./Spinner";

const server = urls.SERVER_URL;

const GetCertificate = () => {
  const [certificate, setCertificate] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = new URLSearchParams(window.location.search);
  const searchParamsString = searchParams.toString();
  const navigate = useNavigate();
  const serial = searchParams.get("serial");
  const [imageSrc, setImageSrc] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!serial) {
      navigate("/event_management");
    }
    getCertificate();
  }, [searchParamsString]);

  const getCertificate = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${server}/api/get_certificate?serial=${serial}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);
      setImageSrc(imageUrl);
    } catch (error) {
      toast.error("Certificate not found or not yet verified");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await axios.get(
        `${server}/api/preview_certificate?serial=${serial}`
      );
      setPreviewImage(`data:image/png;base64,${res.data.image}`);
    } catch (error) {
      toast.error("Failed to load preview");
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
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {loading && <Spinner message="Loading certificate..." />}
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

export default GetCertificate;
