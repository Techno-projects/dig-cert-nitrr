import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useLocation } from 'react-router-dom';
// import './css/Table.css';

const Table = () => {
  const location = useLocation()
  const data = location.state.data;

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

  const onCellClicked = (params) => {
    setSelectedCellValue(params.value);
    if (params.colDef.field === 'Email') {
      console.log(params.value);
    }
  };

  if (data.length > 0) {
    const firstObject = data[0];
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

  return (
    <div className="table-container">
      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        {selectedCellValue && <>Selected Cell: {selectedCellValue}</>}
        <AgGridReact
          onCellClicked={onCellClicked}
          columnDefs={columnDefs}
          rowData={data}
        />
      </div>
    </div>
  );
};

export default Table;