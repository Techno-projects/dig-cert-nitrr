import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "react-jwt";
import axios from "axios";
import "./css/Form.css";
import "./css/EventManagement.css";
import urls from "../urls.json";
import toast from "react-hot-toast";
import { Spinner, ButtonSpinner } from "./Spinner";

const server = urls.SERVER_URL;

const EventManagementPage = () => {
  const auth = localStorage.getItem("login");
  const user = decodeToken(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState({
    user: user.email,
    file: null,
    event: "",
    cdc: true,
  });

  if (!auth) {
    toast.error("Unauthorized user. Please login first.");
    window.location.href = "/";
  }
  const [selectedFile, setSelectedFile] = useState(null);
  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState({});
  const [dispatch, setDispatch] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!auth || !user) {
      window.location.href = "/";
    }
    const get_orgs = async () => {
      try {
        const response = await axios.post(
          `${server}/api/get_all_org`,
          { token: auth },
          {
            headers: {
              "Content-type": "application/json",
            },
          }
        );
        setPartners(response.data.message);
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching organisations");
        window.location.reload();
      } finally {
        setOrgsLoading(false);
      }
    };
    get_orgs();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.name === "cdc") {
      setEventData({ ...eventData, cdc: !eventData.cdc });
    } else {
      setEventData({ ...eventData, [e.target.name]: e.target.value });
    }
  };

  const handlePartners = (e) => {
    const tmp = { ...selectedPartners };
    tmp[e.target.value] = e.target.checked;
    setSelectedPartners(tmp);
  };

  const handleDispatch = (e) => {
    setDispatch(e.target.value);
  };

  const [certi, setFile] = useState();
  const imageRef = useRef(null);
  const rectRef = useRef(null);

  const upload = async () => {
    if (!dispatch) {
      toast.error("Please select 'Dispatched by' before uploading the certificate");
      return;
    }
    if (eventData.event !== "" && selectedFile !== null) {
      eventData.file = selectedFile;

      setUploading(true);

      const tmpBody = { partners: selectedPartners, token: auth };
      try {
        const response = await axios.post(
          `${server}/api/get_faculties`,
          tmpBody,
          {
            headers: {
              "Content-type": "application/json",
            },
          }
        );
        navigate("/certificate", {
          state: {
            eventData: eventData,
            faculties: response.data.message,
            dispatch: dispatch,
          },
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching faculties");
        window.location.href = "/event_management";
      } finally {
        setUploading(false);
      }
    } else {
      toast.error("Please fill all the required data");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {orgsLoading && <Spinner message="Loading organisations..." />}
      {uploading && <Spinner message="Preparing certificate..." />}

      <div style={{ flexGrow: "1", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div className="em-card">
          <h1>Event Management</h1>

          {/* Event Name */}
          <div className="em-section">
            <span className="em-section-label">Event Name</span>
            <input
              className="em-input"
              placeholder="Enter event name"
              type="text"
              id="event_name"
              name="event"
              value={eventData.event}
              onChange={handleChange}
              required
            />
          </div>

          {/* Participants Upload */}
          <div className="em-section">
            <span className="em-section-label">Participants List</span>
            <div className="em-file-zone">
              <input
                type="file"
                id="participants"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                required
              />
              <div className="em-file-hint">Upload Excel file (.xlsx) with participant details</div>
            </div>
          </div>

          {/* CDC checkbox */}
          <div className="em-section">
            <div className="em-check-item">
              <input
                type="checkbox"
                name="cdc"
                checked={eventData.cdc}
                disabled
                onChange={handleChange}
              />
              <span>CDC/DSW Signature Required</span>
            </div>
          </div>

          {/* Dispatch & Partners side by side */}
          <div className="em-options-row">
            <div className="em-option-group">
              <span className="em-section-label">Dispatched by</span>
              <div className="em-check-item">
                <input
                  type="radio"
                  name="dispatch"
                  value="CDC"
                  id="dispatch-cdc"
                  checked={dispatch === "CDC"}
                  onChange={handleDispatch}
                />
                <label htmlFor="dispatch-cdc">CDC</label>
              </div>
              <div className="em-check-item">
                <input
                  type="radio"
                  name="dispatch"
                  value="DSW"
                  id="dispatch-dsw"
                  checked={dispatch === "DSW"}
                  onChange={handleDispatch}
                />
                <label htmlFor="dispatch-dsw">DSW</label>
              </div>
            </div>

            <div className="em-option-group">
              <span className="em-section-label">Partners</span>
              <div className="em-partners-grid">
                {partners.map((partner, idx) => (
                  <div className="em-check-item" key={idx}>
                    <input
                      type="checkbox"
                      value={partner}
                      id={`partner-${idx}`}
                      onChange={handlePartners}
                    />
                    <label htmlFor={`partner-${idx}`}>{partner}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="em-submit" type="button" onClick={upload} disabled={uploading}>
            {uploading ? <ButtonSpinner text="Processing..." /> : "Next: Design Certificate →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventManagementPage;


