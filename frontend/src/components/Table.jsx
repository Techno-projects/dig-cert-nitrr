import React, { useEffect, useRef, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./css/Table.css";
import { decodeToken } from "react-jwt";
import urls from "../urls.json";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { CsvExportModule } from "@ag-grid-community/csv-export";
import { ModuleRegistry } from "@ag-grid-community/core";
import toast from "react-hot-toast";
import "react-image-crop/dist/ReactCrop.css";
import ImageCrop from "./ImageCrop";
import * as XLSX from 'xlsx';
import LoadingBar from "./LoadingBar";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
]);

const server = urls.SERVER_URL;

/* ─── Certificate Preview Modal ─── */
const CertificatePreviewModal = ({ previewUrl, serial, onClose, previewLoading }) => {
  const [zoom, setZoom] = useState(100);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 15, 200));
      if (e.key === "-") setZoom((z) => Math.max(z - 15, 30));
      if (e.key === "0") setZoom(100);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `certificate_${serial || "preview"}.png`;
    a.click();
  };

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-card">
          {/* Header */}
          <div className="preview-modal-header">
            <div className="preview-modal-title">
              <span className="modal-icon">📜</span>
              Certificate Preview
              {serial && <span className="serial-badge">SN: {serial}</span>}
            </div>
            <div className="preview-modal-actions">
              {/* Zoom controls */}
              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={() => setZoom((z) => Math.max(z - 15, 30))}
                  title="Zoom out (−)"
                >
                  −
                </button>
                <span className="zoom-level">{zoom}%</span>
                <button
                  className="zoom-btn"
                  onClick={() => setZoom((z) => Math.min(z + 15, 200))}
                  title="Zoom in (+)"
                >
                  +
                </button>
                <button
                  className="zoom-btn"
                  onClick={() => setZoom(100)}
                  title="Reset zoom (0)"
                  style={{ fontSize: "0.65rem" }}
                >
                  ⟲
                </button>
              </div>

              <button className="modal-action-btn download-btn" onClick={handleDownload}>
                ⬇ Download
              </button>
              <button className="modal-action-btn close-btn" onClick={onClose}>
                ✕ Close
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="preview-modal-body">
            {previewLoading ? (
              <div className="preview-loading">
                <div className="preview-loading-spinner" />
                <span>Generating certificate preview…</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Certificate Preview"
                style={{ transform: `scale(${zoom / 100})` }}
                draggable={false}
              />
            ) : (
              <div className="preview-loading">
                <span>No preview available</span>
              </div>
            )}
          </div>

          {/* Footer shortcuts */}
          <div className="shortcut-hint">
            <span>
              <kbd>Esc</kbd> close &nbsp;·&nbsp; <kbd>+</kbd> <kbd>−</kbd> zoom
              &nbsp;·&nbsp; <kbd>0</kbd> reset
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Table Component ─── */
const Table = () => {
  const auth = localStorage.getItem("login");
  const fac_signed_in = decodeToken(auth);
  const location = useLocation();
  const [pending_data, set_pending_data] = useState([]);
  const [my_signed, set_my_signed] = useState([]);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const fac_email = location.state.email;
  const columnDefs1 = [];
  const columnDefs2 = [];
  const selectedCellValue = null;
  const [submitting, setSubmitting] = useState(false);

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewSerial, setPreviewSerial] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (!auth) {
    toast.error("Unauthorized user. Please login first.");
    window.location.href = "/";
  }

  useEffect(() => {
    const getEvents = async () => {
      try {
        const response = await axios.post(
          `${server}/api/get_event_details`,
          { email: fac_email },
          {
            headers: {
              "Content-type": "application/json",
            },
          }
        );
        const data = response.data;
        console.log(data);
        if (data.ok) {
          set_my_signed(data.signed);
          set_pending_data(data.pending);
        } else {
          toast.error("Error while fetching events");
        }
      } catch (error) {
        toast.error(error.response.data.message ?? "Something went wrong");
        window.location.href = "/login?type=faculty";
      } finally {
        setLoading(false);
      }
    };
    const getCDCEvents = async () => {
      try {
        const response = await axios.get(`${server}/api/get_cdc_events`, {
          headers: {
            "Content-type": "application/json",
          },
        });
        const data = response.data;
        console.log("Data: ");
        console.log(response);
        if (data.ok) {
          set_my_signed(data.signed);
          set_pending_data(data.pending);
        } else {
          toast.error("Error while fetching events");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    const getDSWEvents = async () => {
      try {
        const response = await axios.get(`${server}/api/get_dsw_events`, {
          headers: {
            "Content-type": "application/json",
          },
        });
        const data = response.data;
        console.log("Data: ");
        console.log(response);
        if (data.ok) {
          set_my_signed(data.signed);
          set_pending_data(data.pending);
        } else {
          toast.error("Error while fetching events");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    console.log("Decoded token:", fac_signed_in);
    console.log(decodeToken(localStorage.getItem("login")));

    if (fac_signed_in.iscdc && !fac_signed_in.isdsw) {
      getCDCEvents();
    } else if (fac_signed_in.isdsw && !fac_signed_in.iscdc) {
      getDSWEvents();
    } else {
      getEvents();
    }
  }, [fac_email]);

  const onCellClicked = (e) => {
    if (e.colDef.field === "Serial No" && navigator.clipboard) {
      navigator.clipboard.writeText(e.value);
      toast("Text copied");
    }
  };

  if (pending_data.length > 0) {
    let allProperties = Array.from(
      new Set(pending_data.flatMap((obj) => Object.keys(obj)))
    );
    let columnDef = {
      headerName: "Organisation",
      field: "Organisation",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Event",
      field: "Event",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
    };
    columnDefs1.push(columnDef);
    for (const key of allProperties) {
      if (key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === "sortableColumn",
          filter: key === "column" ? "agDateColumnFilter" : "agSetColumnFilter",
        };
        columnDefs1.push(columnDef);
      }
    }
  }

  if (my_signed.length > 0) {
    let allProperties = Array.from(
      new Set(my_signed.flatMap((obj) => Object.keys(obj)))
    );
    let columnDef = {
      headerName: "Organisation",
      field: "Organisation",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
    };
    columnDefs2.push(columnDef);
    columnDef = {
      headerName: "Event",
      field: "Event",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
    };
    columnDefs2.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
    };
    columnDefs2.push(columnDef);

    for (const key of allProperties) {
      if (key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === "sortableColumn",
          filter: key === "column" ? "agDateColumnFilter" : "agSetColumnFilter",
        };
        columnDefs2.push(columnDef);
      }
    }
  }

  const gridApi1 = useRef(null);
  const signedRef = useRef();

  const getSizeBase64 = (base64) => {
    var binaryString = atob(base64);
    var sizeInBytes = binaryString.length;
    var sizeInKB = sizeInBytes / 1024;
    return sizeInKB;
  };

  const makePromiseAndSubmit = () => {
    return new Promise(async (resolve, reject) => {
      setSubmitting(true);
      const selectedRows = gridApi1.current.getSelectedRows();
      if (!signature) {
        localStorage.setItem("toast-error", "Please upload your signature");
        setSubmitting(false);
        reject();
      }
      for (let i = 0; i < selectedRows.length; i++) {
        selectedRows[i].organisation = location.state.org_name;
        selectedRows[i].event_name = location.state.event_name;
        selectedRows[i].token = auth;
      }
      selectedRows.push(signature);
      try {
        let response;
        if (!fac_signed_in.iscdc && !fac_signed_in.isdsw) {
          response = await axios.post(`${server}/api/approveL0`, selectedRows, {
            headers: {
              "Content-type": "application/json",
            },
          });
        } else {
          response = await axios.post(`${server}/api/approveL1`, selectedRows, {
            headers: {
              "Content-type": "application/json",
            },
          });
        }
        if (response.data.ok) {
          resolve("Signed successfully");
        }
      } catch (error) {
        console.error(error?.response?.data);
        localStorage.setItem(
          "toast-error",
          error?.response?.data?.message ?? "Something went wrong"
        );
        setSubmitting(false);
        reject(error?.response?.data?.message ?? "Something went wrong");
      }
      setSubmitting(false);
      resolve();
    });
  };

  const submitSelectedRows = async () => {
    const signatureSize = getSizeBase64(signature);
    console.log(signatureSize);
    if (signatureSize > 800) {
      toast.error("Signature image size is too large");
      return;
    }
    toast.promise(makePromiseAndSubmit(), {
      loading: "Please wait...",
      success: () => {
        window.location.reload();
        return "Signed Successfully";
      },
      error: () => {
        const message = localStorage.getItem("toast-error");
        localStorage.removeItem("toast-error");
        return message ?? "Couldn't sign some/all of the certificates";
      },
    });
  };

  const onBtExportSigned = useCallback(() => {
    if (signedRef.current) {
      const csvData = signedRef.current.getDataAsCsv();
      const workbook = XLSX.read(csvData, { type: 'string' });
      XLSX.writeFile(workbook, "SignedCertificatesReport.xlsx");
    } else {
      console.error("Grid API not available!");
    }
  }, []);

  const onBtExportPending = useCallback(() => {
    if (gridApi1.current) {
      const csvData = gridApi1.current.getDataAsCsv();
      const workbook = XLSX.read(csvData, { type: 'string' });
      XLSX.writeFile(workbook, "PendingCertificatesReport.xlsx");
    } else {
      console.error("Grid API not available!");
    }
  }, []);

  const handlePreviewCertificate = async () => {
    if (!signedRef.current) {
      toast.error("Failed to access table API.");
      return;
    }
    const selectedRows = signedRef.current.getSelectedRows();

    if (selectedRows.length === 0 || !selectedRows[0]["Serial No"]) {
      toast.error("Please select an event with a valid serial number.");
      return;
    }

    const serial = selectedRows[0]["Serial No"];
    setPreviewSerial(serial);
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const response = await axios.get(
        `${server}/api/preview_certificate?serial=${serial}&preview=true`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
    } catch (error) {
      toast.error("Failed to load certificate preview.");
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = useCallback(() => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewSerial(null);
  }, [previewUrl]);

  return (
    <div className="table-container">
      {/* Loading bar */}
      {loading && <LoadingBar />}

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Faculty Dashboard</h1>
        <p>Manage and sign certificates for your events</p>
      </div>

      {/* Stat Badges */}
      {!loading && (
        <div className="dashboard-stats">
          <div className="stat-badge">
            <div className="stat-icon pending">⏳</div>
            <div>
              <div className="stat-number">{pending_data.length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-badge">
            <div className="stat-icon signed">✓</div>
            <div>
              <div className="stat-number">{my_signed.length}</div>
              <div className="stat-label">Signed</div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Side-by-Side */}
      <div className="tables" style={{ display: "flex" }}>
        {/* Pending Certificates */}
        <div className="table-section">
          <div className="section-title">
            <span className="title-dot pending"></span>
            Pending Certificates
          </div>
          <div className="table-card">
            <div
              className="ag-theme-alpine-dark"
              style={{ height: 380, width: "100%" }}
            >
              {pending_data.length > 0 ? (
                <AgGridReact
                  onGridReady={(params) => {
                    gridApi1.current = params.api;
                  }}
                  onCellClicked={onCellClicked}
                  columnDefs={columnDefs1}
                  rowData={pending_data}
                  rowSelection={"multiple"}
                />
              ) : (
                !loading && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🎉</div>
                    <div className="empty-state-text">No pending certificates</div>
                    <div className="empty-state-subtext">You're all caught up!</div>
                  </div>
                )
              )}
            </div>
            {pending_data.length > 0 && (
              <div className="btn-group">
                {!submitting ? (
                  <button
                    className="action-btn primary"
                    onClick={submitSelectedRows}
                  >
                    <span className="btn-icon">✍</span> Sign Selected
                  </button>
                ) : (
                  <button className="action-btn primary" disabled>
                    <span className="btn-icon">⏳</span> Signing…
                  </button>
                )}
                <button className="action-btn" onClick={onBtExportPending}>
                  <span className="btn-icon">📥</span> Export Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Signed Certificates */}
        <div className="table-section">
          <div className="section-title">
            <span className="title-dot signed"></span>
            Your Signed Certificates
          </div>
          <div className="table-card">
            <div
              className="ag-theme-alpine-dark"
              style={{ height: 380, width: "100%" }}
            >
              {my_signed.length > 0 ? (
                <AgGridReact
                  onGridReady={(params) => {
                    signedRef.current = params.api;
                    console.log("Grid API:", signedRef.current);
                  }}
                  onCellClicked={onCellClicked}
                  ref={signedRef}
                  columnDefs={columnDefs2}
                  rowData={my_signed}
                  rowSelection={"single"}
                />
              ) : (
                !loading && (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">No signed certificates yet</div>
                    <div className="empty-state-subtext">
                      Sign pending certificates to see them here
                    </div>
                  </div>
                )
              )}
            </div>
            {my_signed.length > 0 && (
              <div className="btn-group">
                <button
                  className="action-btn success"
                  onClick={handlePreviewCertificate}
                >
                  <span className="btn-icon">👁</span> Preview Certificate
                </button>
                <button className="action-btn" onClick={onBtExportSigned}>
                  <span className="btn-icon">📥</span> Export Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Upload Section */}
      <div className="signature-section">
        <div className="signature-card">
          <div className="signature-card-title">
            <span className="sig-icon">✒️</span>
            Upload Your Signature
          </div>
          <ImageCrop setSignature={setSignature} />
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && (
        <CertificatePreviewModal
          previewUrl={previewUrl}
          serial={previewSerial}
          onClose={closePreview}
          previewLoading={previewLoading}
        />
      )}
    </div>
  );
};

export default Table;
