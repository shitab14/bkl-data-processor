import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { processReportB } from './processReportB';
import './StudentContinuationPage.css';

const StudentContinuationPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedWorkbook, setProcessedWorkbook] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showTransferOut, setShowTransferOut] = useState(false);
  const [showCompleter, setShowCompleter] = useState(false);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrorMessage('File size exceeds the limit of 20MB.');
        return;
      }

      setErrorMessage('');
      setUploadedFile(file);
      processFile(file);
    }
  };

  const processFile = (file) => {
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      try {
        const outputWorkbook = processReportB(workbook);
        setProcessedWorkbook(outputWorkbook);

        // Get initial preview data
        const sheetData = XLSX.utils.sheet_to_json(outputWorkbook.Sheets['Processed Data'], { header: 1 });
        setPreviewData(sheetData);
      } catch (error) {
        setErrorMessage(`Error processing file: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownload = () => {
    if (!processedWorkbook) return;

    // Create a copy of the workbook to modify
    const downloadWorkbook = XLSX.utils.book_new();
    const originalSheet = processedWorkbook.Sheets['Processed Data'];

    // Get headers and find status column index
    const headers = XLSX.utils.sheet_to_json(originalSheet, { header: 1 })[0];
    const statusIndex = headers.findIndex(header =>
      header.toLowerCase().includes('status')
    );

    // Filter rows based on toggles if status column exists
    let filteredData = XLSX.utils.sheet_to_json(originalSheet, { header: 1 });
    if (statusIndex !== -1) {
      filteredData = [
        filteredData[0], // headers
        ...filteredData.slice(1).filter(row => {
          const status = String(row[statusIndex] || '').toLowerCase();
          return (
            (showWithdrawal || !status.includes('withdrawal')) &&
            (showTransferOut || !status.includes('transfer out')) &&
            (showCompleter || !status.includes('completer'))
          );
        })
      ];
    }

    // Create new worksheet with filtered data
    const newWorksheet = XLSX.utils.aoa_to_sheet(filteredData);
    XLSX.utils.book_append_sheet(downloadWorkbook, newWorksheet, 'Processed Data');

    // Generate and download the file
    const outputData = XLSX.write(downloadWorkbook, { type: 'array', bookType: 'xlsx' });
    const outputBlob = new Blob([outputData], { type: 'application/octet-stream' });
    saveAs(outputBlob, `processed_${uploadedFile.name}`);
  };

  const getFilteredData = () => {
    if (!previewData.length) return [];

    const headers = previewData[0];
    const statusIndex = headers.findIndex(header =>
      header.toLowerCase().includes('status')
    );

    if (statusIndex === -1) return previewData;

    return [
      previewData[0],
      ...previewData.slice(1).filter(row => {
        const status = String(row[statusIndex] || '').toLowerCase();
        return (
          (showWithdrawal || !status.includes('withdrawal')) &&
          (showTransferOut || !status.includes('transfer out')) &&
          (showCompleter || !status.includes('completer'))
        );
      })
    ];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.xlsx',
    multiple: false,
  });

  const getCellColor = (value, header) => {
    const worksheetHeaders = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    if (worksheetHeaders.includes(header) && value >= 4) {
      return { backgroundColor: '#FFCCCB' };
    }

    if (header === 'Accuracy (%)' && value > 80) {
      return { backgroundColor: '#90EE90' };
    }

    return {};
  };

  const filteredData = getFilteredData();

  return (
    <div className="app">
      <h1 className="page-title">Student Continuation Data Analysis</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag & drop an .xlsx file here, or click to select one</p>
        )}
      </div>

      {uploadedFile && (
        <div className="file-preview">
          <h3>Uploaded File:</h3>
          <p>
            <strong>Name:</strong> {uploadedFile.name}
          </p>
          <p>
            <strong>Size:</strong> {(uploadedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="preview-table">
          <div className="table-controls">
            <h3>File Preview:</h3>
            <div className="status-toggles">
              <label className="toggle-status">
                <input
                  type="checkbox"
                  checked={showWithdrawal}
                  onChange={() => setShowWithdrawal(!showWithdrawal)}
                />
                Show Withdrawal
              </label>
              <label className="toggle-status">
                <input
                  type="checkbox"
                  checked={showTransferOut}
                  onChange={() => setShowTransferOut(!showTransferOut)}
                />
                Show Transfer Out
              </label>
              <label className="toggle-status">
                <input
                  type="checkbox"
                  checked={showCompleter}
                  onChange={() => setShowCompleter(!showCompleter)}
                />
                Show Completer
              </label>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {filteredData[0].map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={getCellColor(cell, filteredData[0][cellIndex])}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isProcessing && <p className="processing">Processing file...</p>}

      {processedWorkbook && (
        <button
          onClick={handleDownload}
          className="floating-download-button"
          title="Download Processed File"
        >
          Download
        </button>
      )}
    </div>
  );
};

export default StudentContinuationPage;