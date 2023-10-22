import React, { useState } from 'react';
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
  const pending_data = location.state.pending;
  const my_signed = location.state.signed;

  console.log(pending_data);
  console.log(my_signed);
  const [signature, setSignature] = useState(null);

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
    const response = await axios.post('http://localhost:8000/api/approveL0', row_data, {
      headers: {
        'Content-type': 'application/json'
      }
    });
    if (response.data.ok) {
      alert("Signed");
    }
  };

  if (pending_data.length > 0) {
    const firstObject = pending_data[0];
    let columnDef = {
      headerName: "Organisation",
      field: "Organisation",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Event",
      field: "Event",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs1.push(columnDef);
    columnDef = {
      headerName: "Serial No",
      field: "Serial No",
      sortable: 'sortableColumn',
      filter: 'agSetColumnFilter',
    };
    columnDefs1.push(columnDef);
    for (const key in firstObject) {
        if (firstObject.hasOwnProperty(key) && key !== "Organisation" && key !== "Event" && key !== "Serial No") {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === 'sortableColumn',
          filter: key === 'column' ? 'agDateColumnFilter' : 'agSetColumnFilter',
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

  return (
    <div className="table-container">
      <div className='tables' style={{ display: 'flex' }}>
        <div className="ag-theme-alpine" style={{ height: 400, width: '50vw' }}>
          <h1>Pending Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            onCellClicked={onCellClicked}
            columnDefs={columnDefs1}
            rowData={pending_data}
          />
        </div>
        <div className="ag-theme-alpine" style={{ height: 400, width: '50vw' }}>
          <h1>Your Signed Certificates</h1>
          {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
          <AgGridReact
            columnDefs={columnDefs2}
            rowData={my_signed}
          />
        </div>
      </div>
      <input type='file' accept="image/*" onChange={(e) => handleSign(e)} />
    </div>
  );
};

export default Table;