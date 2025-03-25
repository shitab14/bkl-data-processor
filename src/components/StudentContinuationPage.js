import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { processReportB } from './processReportB';
import './StudentContinuationPage.css';

const StudentContinuationPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedFile, setProcessedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file drop/upload
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      // Check file size (e.g., limit to 20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        setErrorMessage('File size exceeds the limit of 20MB.');
        return;
      }

      setErrorMessage('');
      setUploadedFile(file);
      processFile(file);
    }
  };

  // Process the uploaded file
  const processFile = (file) => {
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      try {
        // Process the Report B sheet
        const outputWorkbook = processReportB(workbook);

        // Generate output file
        const outputData = XLSX.write(outputWorkbook, { type: 'array', bookType: 'xlsx' });
        const outputBlob = new Blob([outputData], { type: 'application/octet-stream' });

        setProcessedFile(outputBlob);

        // Get the processed data (without projections)
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

  // Handle file download
  const handleDownload = () => {
    if (processedFile) {
      saveAs(processedFile, `processed_${uploadedFile.name}`);
    }
  };

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.xlsx',
    multiple: false,
  });

  // Function to get cell color
  const getCellColor = (value, header) => {
    const worksheetHeaders = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    // Apply red color for worksheet counts of 4 and above
    if (worksheetHeaders.includes(header) && value >= 4) {
      return { backgroundColor: '#FFCCCB' };
    }

    // Apply green color for accuracy over 80%
    if (header === 'Accuracy (%)' && value > 80) {
      return { backgroundColor: '#90EE90' };
    }

    return {}; // Default style
  };

  return (
    <div className="app">
      <h1 className="page-title">Student Continuation Data Analysis</h1>

      {/* Error Message */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Drag-and-Drop Section */}
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

      {/* Uploaded File Preview */}
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

      {/* Preview Table */}
      {previewData.length > 0 && (
        <div className="preview-table">
          <h3>File Preview:</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {previewData[0].map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={getCellColor(cell, previewData[0][cellIndex])}
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

      {/* Processing Indicator */}
      {isProcessing && <p className="processing">Processing file...</p>}

      {/* Floating Download Button */}
      {processedFile && (
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