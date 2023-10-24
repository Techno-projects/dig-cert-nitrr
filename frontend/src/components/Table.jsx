import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
// import './css/Table.css';
import { decodeToken } from "react-jwt";

const Table = () => {
  const auth = localStorage.getItem('login');
  const fac_signed_in = decodeToken(auth);
  const location = useLocation()
  const [pending_data, set_pending_data] = useState([]);
  const [my_signed, set_my_signed] = useState([]);
  const [signature, setSignature] = useState(null);
  const fac_email = location.state.email;
  const columnDefs1 = [];
  const columnDefs2 = [];
  const [selectedCellValue, setSelectedCellValue] = useState(null);
  const filterParams = {
    filter: 'agDateColumnFilter',
    filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEqual'],
  };

  const dateFilterParams = {
    filter: 'agTextColumnFilter', // Use text filter for date column
    filterOptions: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEqual', 'greaterThan'],
  };

  const handleSignatureSubmit = () => {
    const signature = window.prompt('Please enter your signature:');
    if (signature) {
      // Handle the signature input here
      alert('Signature submitted: ' + signature);
    }
  };


  const onCellClicked = async (params) => {
    if (!signature) {
      alert("Please upload your signature")
      return;
    }
    const row_data = {};
    const headers = Object.keys(params.data);
    headers.map(col => {
      row_data[col] = params.data[col]
    })
    row_data.organisation = location.state.org_name;
    row_data.event_name = location.state.event_name;
    row_data.faculty_sign = signature;
    row_data.fac_signed_in = fac_signed_in.email;
    row_data.token = auth;
    try {
      const response = await axios.post('http://localhost:8000/api/approveL0', row_data, {
        headers: {
          'Content-type': 'application/json'
        }
      });
      if (response.data.ok) {
        let copy_pending = [...pending_data];
        const copy_signed = [...my_signed];
        const deleted_row = copy_pending.filter(row => row["Serial No"] === params.data["Serial No"])
        copy_pending = copy_pending.filter(row => row["Serial No"] !== params.data["Serial No"]);
        copy_signed.push(deleted_row);
        set_pending_data(copy_pending);
        set_my_signed(copy_signed);
        alert("Signed");
        window.location.reload();
      }
    }
    catch (error) {
      console.log(error.response.data);
      alert(error.response.data.message);
      // window.location.reload();
    }
  };

  useEffect(() => {
    const getEvents = async () => {
      try {
        const response = await axios.post('http://localhost:8000/api/get_event_details', { email: fac_email }, {
          headers: {
            "Content-type": "application/json"
          }
        });
        const data = response.data;
        if (data.ok) {
          set_my_signed(data.signed)
          set_pending_data(data.pending)
        }
        else {
          console.log();
          alert("Error logging in");
          // window.location.href = "/login?type=faculty";
        }
      }
      catch (error) {
        alert(error.response.data.message);
        // history.pushState("/login?type=faculty");
        // window.location.href = "/login?type=faculty";
      }
    }
    getEvents();
  }, [fac_email]);

  if (pending_data.length > 0) {
    const firstObject = pending_data[0];
    let columnDef = {
      headerName: "Organisation",
      field: "Organisation",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Event",
      field: "Event",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
      // headerCheckboxSelection: true,
      // headerCheckboxSelectionFilteredOnly: true,
      // checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
      // headerCheckboxSelection: true,
      // headerCheckboxSelectionFilteredOnly: true,
      // checkboxSelection: true,
    };
    columnDefs1.push(columnDef);
    for (const key in firstObject) {
      if (firstObject.hasOwnProperty(key) && key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === 'sortableColumn',
          filter: key === 'column' ? 'agDateColumnFilter' : 'agSetColumnFilter',
          // headerCheckboxSelection: true,
          // headerCheckboxSelectionFilteredOnly: true,
          // checkboxSelection: true,
        };
        columnDefs1.push(columnDef);
      }
    }
  }

  if (my_signed.length > 0) {
    const firstObject = my_signed[0];
    let columnDef = {
      headerName: "Organisation",
      field: "Organisation",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs2.push(columnDef);
    columnDef = {
      headerName: "Event",
      field: "Event",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs2.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs2.push(columnDef);

    for (const key in firstObject) {
      if (firstObject.hasOwnProperty(key) && key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === 'sortableColumn',
          filter: key === 'column' ? 'agDateColumnFilter' : 'agSetColumnFilter',
        };
        columnDefs2.push(columnDef);
      }
    }
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSign = async (e) => {
    const base64String = await convertFileToBase64(e.target.files[0]);

    setSignature(base64String);
  }

  // const [signature, setSignature] = useState('');

  // const convertFileToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result);
  //     reader.onerror = error => reject(error);
  //   });
  // };


  const handleSubmission = () => {
    const storedSignature = localStorage.getItem('signature');
    if (storedSignature) {
      setSignature(storedSignature);
    } else {
      alert('File has been submitted successfully');
      localStorage.setItem('signature', signature);
    }
  };

  const gridApi1 = useRef(null);
  const submitSelectedRows = async () => {
    const selectedRows = gridApi1.current.getSelectedRows();
    if (!signature) {
      alert("Please upload your signature")
      return;
    }
    for (let i = 0; i < selectedRows.length; i++) {
      selectedRows[i].organisation = location.state.org_name;
      selectedRows[i].event_name = location.state.event_name;
      selectedRows[i].faculty_sign = signature;
      selectedRows[i].fac_signed_in = fac_signed_in.email;
      selectedRows[i].token = auth;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/approveL0', selectedRows, {
        headers: {
          'Content-type': 'application/json'
        }
      });
      if (response.data.ok) {
        // let copy_pending = [...pending_data];
        // const copy_signed = [...my_signed];
        // const deleted_row = copy_pending.filter(row => row["Serial No"] === params.data["Serial No"])
        // copy_pending = copy_pending.filter(row => row["Serial No"] !== params.data["Serial No"]);
        // copy_signed.push(deleted_row);
        // set_pending_data(copy_pending);
        // set_my_signed(copy_signed);
        alert("Signed");
        // window.location.reload();
      }
    }
    catch (error) {
      console.log(error.response.data);
      alert(error.response.data.message);
      // window.location.reload();
    }
  }

  return (
    <div className="table-container" style={{ padding: '4rem' }}>
      <div className='tables' style={{ display: 'flex' }}>
        <div className="ag-theme-alpine" style={{ height: 400, width: '40vw', padding: '1rem', textAlign: 'center' }}>
          <h1>Pending Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            onGridReady={(params) => {
              gridApi1.current = params.api;
            }}
            // onCellClicked={onCellClicked}
            columnDefs={columnDefs1}
            rowData={pending_data}
            rowSelection={'multiple'}
          />
          <button onClick={submitSelectedRows}>Submit</button>
        </div>
        <div className="ag-theme-alpine" style={{ height: 400, width: '40vw', padding: '1rem', textAlign: 'center' }}>
          <h1>Your Signed Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            columnDefs={columnDefs2}
            rowData={my_signed}
          />
        </div>
      </div>
      <div className='Table_button' style={{ position: 'relative', marginTop: '10rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
        <input type='file' accept="image/*" onChange={handleSign} />
        <button onClick={handleSubmission}>Submit Signature</button>
      </div>
    </div>
  );
};

export default Table;