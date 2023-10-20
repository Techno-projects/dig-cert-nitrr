import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
// import './css/Table.css';

const Table = () => {
  const location = useLocation()
  const data = location.state.data;
  const [signature, setSignature] = useState(null);

  const columnDefs = [];
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
    const sendData = {...params}
    sendData.data.organisation = location.state.org_name;
    sendData.data.event_name = location.state.event_name;
    sendData.data.faculty_sign = signature;
    console.log(sendData.data);
    const response = await axios.post('http://localhost:8000/api/approveL0', sendData.data, {
      headers: {
        'Content-type': 'application/json'
      }
    });
    console.log(response);
    if (response.data.ok) {
      alert("Signed");
    }
  };

  if (data.length > 0) {
    const firstObject = data[0];
    columnDefs.push({
      headerName: 'Organisation',
      field: 'organisation',
      valueGetter: () => location.state.org_name,
    });
    columnDefs.push({
      headerName: 'Event Name',
      field: 'organisation',
      valueGetter: () => location.state.event_name,
    });
    for (const key in firstObject) {
      if (firstObject.hasOwnProperty(key)) {
        const columnDef = {
          headerName: key,
          field: key,
          sortable: key === 'sortableColumn',
          filter: key === 'column' ? 'agDateColumnFilter' : 'agSetColumnFilter',
        };
        columnDefs.push(columnDef);
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
      <div className="ag-theme-alpine" style={{ height: 400, width: '100vw' }}>
        {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
        <AgGridReact
          onCellClicked={onCellClicked}
          columnDefs={columnDefs}
          rowData={data}
        />
      </div>
      <input type='file' accept="image/*" onChange={(e) => handleSign(e)} />
    </div>
  );
};

export default Table;