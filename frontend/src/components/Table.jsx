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
import { ExcelExportModule } from "@ag-grid-enterprise/excel-export";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { ModuleRegistry } from "@ag-grid-community/core";
import toast from "react-hot-toast";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ImageCrop from "./ImageCrop";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
  ExcelExportModule,
  MenuModule,
]);

const server = urls.SERVER_URL;

const Table = () => {
  const auth = localStorage.getItem("login");
  const fac_signed_in = decodeToken(auth);
  const location = useLocation();
  const [pending_data, set_pending_data] = useState([]);
  const [my_signed, set_my_signed] = useState([]);
  const [signature, setSignature] = useState(null);
  const fac_email = location.state.email;
  const columnDefs1 = [];
  const columnDefs2 = [];
  const selectedCellValue = null;
  const [toastError, setToastError] = useState(
    "Couldn't sign some/all of the certificates"
  );
  const [submitting, setSubmitting] = useState(false);

  if (!auth) {
    toast.error("Unauthorized user");
    window.location.href("/");
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
          // window.location.href = "/login?type=faculty";
        }
      } catch (error) {
        toast.error(error.response.data.message ?? "Something went wrong");
        // history.pushState("/login?type=faculty");
        window.location.href = "/login?type=faculty";
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
        if (data.ok) {
          set_my_signed(data.signed);
          set_pending_data(data.pending);
        } else {
          toast.error("Error while fetching events");
          // window.location.href = "/login?type=faculty";
        }
      } catch (error) {
        toast.error(error.response.data.message ?? "Something went wrong");
        // history.pushState("/login?type=faculty");
        // window.location.href = "/login?type=faculty";
      }
    };
    if (!fac_signed_in.iscdc) {
      getEvents();
    } else {
      getCDCEvents();
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
      // headerCheckboxSelection: true,
      // headerCheckboxSelectionFilteredOnly: true,
      // checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: "sortableColumn",
      filter: "agSetColumnFilter",
      // headerCheckboxSelection: true,
      // headerCheckboxSelectionFilteredOnly: true,
      // checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    for (const key of allProperties) {
      if (key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === "sortableColumn",
          filter: key === "column" ? "agDateColumnFilter" : "agSetColumnFilter",
          // headerCheckboxSelection: true,
          // headerCheckboxSelectionFilteredOnly: true,
          // checkboxSelection: true,
        };
        columnDefs1.push(columnDef);
      }
    }
  }

  if (my_signed.length > 0) {
    // const firstObject = my_signed[0];
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

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

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
        // toast.error("Please upload your signature");
        setSubmitting(false);
        reject();
      }
      for (let i = 0; i < selectedRows.length; i++) {
        selectedRows[i].organisation = location.state.org_name;
        selectedRows[i].event_name = location.state.event_name;
        selectedRows[i].faculty_sign = signature;
        // selectedRows[i].fac_signed_in = fac_signed_in.email;
        selectedRows[i].token = auth;
      }
      try {
        let response;
        if (!fac_signed_in.iscdc) {
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
        // toast.error(error.response.data.message ?? "Something went wrong");
        setSubmitting(false);
        reject(error?.response?.data?.message ?? "Something went wrong");
      }
      setSubmitting(false);
      resolve();
    });
  };

  const submitSelectedRows = async () => {
    if (getSizeBase64(signature) > 800) {
      toast.error("Signature image size is too large");
      return;
    }
    toast.promise(makePromiseAndSubmit(), {
      loading: "Please wait...",
      success: "Signed successfully. Please reload",
      error: () => {
        const message = localStorage.getItem("toast-error");
        localStorage.removeItem("toast-error");
        return message ?? "Couldn't sign some/all of the certificates";
      },
    });
  };

  const onBtExport = useCallback(() => {
    console.log(signedRef);
    signedRef.current.api.exportDataAsExcel();
  }, []);

  return (
    <div className="table-container" style={{ padding: "4rem" }}>
      <div className="tables" style={{ display: "flex" }}>
        <div
          className="ag-theme-alpine-dark text"
          style={{
            height: 400,
            width: "40vw",
            padding: "1rem",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1>Pending Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            onGridReady={(params) => {
              gridApi1.current = params.api;
            }}
            onCellClicked={onCellClicked}
            columnDefs={columnDefs1}
            rowData={pending_data}
            rowSelection={"multiple"}
          />
          {!submitting ? (
            <button className="submit-btn" onClick={submitSelectedRows}>
              Submit
            </button>
          ) : (
            <>Please wait...</>
          )}
        </div>
        <div
          className="ag-theme-alpine-dark text"
          style={{
            height: 400,
            width: "40vw",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <h1>Your Signed Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            onCellClicked={onCellClicked}
            ref={signedRef}
            columnDefs={columnDefs2}
            rowData={my_signed}
          />
          <button className="submit-btn" onClick={onBtExport}>
            Export Report
          </button>
        </div>
      </div>

      <div
        className="Table_button"
        style={{
          position: "relative",
          marginTop: "7rem",
          paddingLeft: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <ImageCrop setSignature={setSignature} />
      </div>
    </div>
  );
};

export default Table;
