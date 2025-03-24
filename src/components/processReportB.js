import * as XLSX from 'xlsx';

// Function to process the Report B sheet
export const processReportB = (workbook) => {
  // Get the Report B sheet
  const reportBSheet = workbook.Sheets['Report B'];
  if (!reportBSheet) {
    throw new Error('Report B sheet not found in the uploaded file.');
  }

  // Convert the sheet to JSON
  const reportBData = XLSX.utils.sheet_to_json(reportBSheet, { header: 1 });

  // Extract headers (first row)
  const headers = reportBData[0];

  // Find the index where months start (columns after "Status")
  const statusIndex = headers.indexOf('Status');
  if (statusIndex === -1) {
    throw new Error('"Status" column not found in the Report B sheet.');
  }

  // Extract month columns (starting from the column after "Status")
  const monthColumns = headers.slice(statusIndex + 1);

  // Filter out rows with empty student names
  const filteredData = reportBData.slice(1).filter((row) => row[2] && row[2].trim() !== '');

  // Define output headers
  const outputHeaders = [
    'Student Id',
    'Student Name',
    'Type of School',
    'Course',
    'Type of Enrollment',
    'Status',
    'Starting Point',
    'ASHR',
    'Grade',
    'Current Level',
    '7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'Accuracy (%)',
  ];

  // Initialize output data
  const outputData = [outputHeaders];

  // Process each row
  filteredData.forEach((row) => {
    const studentId = row[3]; // Student Number (Column D)
    const studentName = row[2]; // Name (Column C)
    const typeOfSchool = row[5]; // Type of School (Column F)
    const course = row[7]; // Course (Column H)
    const typeOfEnrollment = row[8]; // Type of Enrollment (Column I)
    const status = row[11]; // Status (Column L)
    const startingPoint = row[9]; // Starting Point (Column J)
    const ashr = row[10]; // ASHR (Column K)
    const grade = row[1]; // Grade (Column B)

    // Get the current level (latest level worksheet attended)
    const currentLevel = getCurrentLevelFromLastMonth(row, monthColumns, statusIndex + 1);

    // Count sheet repetitions
    const sheetRepetitions = countSheetRepetitions(row, monthColumns, statusIndex + 1);

    // Calculate accuracy
    const accuracy = calculateAccuracy(row, monthColumns, statusIndex + 1);

    // Add row to output data
    outputData.push([
      studentId,
      studentName,
      typeOfSchool,
      course,
      typeOfEnrollment,
      status,
      startingPoint || 'Unknown', // Handle empty startingPoint
      ashr || 'Unknown', // Handle empty ASHR
      grade || 'Unknown', // Handle empty Grade
      currentLevel,
      ...sheetRepetitions,
      accuracy,
    ]);
  });

  // Create output workbook
  const outputWorkbook = XLSX.utils.book_new();
  const outputSheet = XLSX.utils.aoa_to_sheet(outputData);

  // Add conditional formatting
  addConditionalFormatting(outputSheet, outputData);

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, 'Processed Data');

  return outputWorkbook;
};

// Function to get the current level from the last month's data
//const getCurrentLevelFromLastMonth = (row, monthColumns, startIndex) => {
//  const levels = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
//
//  // Iterate through month columns in reverse order
//  for (let i = monthColumns.length - 1; i >= 0; i--) {
//    const monthData = row[startIndex + i];
//    if (monthData && typeof monthData === 'string') {
//      // Split the month data into individual worksheets
//      const worksheets = monthData.split(',').map((ws) => ws.trim());
//
//      // Find the last valid level in the worksheets
//      for (let j = worksheets.length - 1; j >= 0; j--) {
//        const matchThis = worksheets[j];
//        const worksheet = matchThis.match(/^\d*[A-Za-z]/);
//        if (levels.includes(worksheet)) {
//          return worksheet; // Return the latest valid level
//        }
//      }
//
//    }
//  }
//
//  return ''; // If no valid level is found
//};
// Function to get the current level from the last month's data
const getCurrentLevelFromLastMonth = (row, monthColumns, startIndex) => {
  const levels = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

  // Get the index of the last month column
  const lastMonthIndex = startIndex + monthColumns.length - 1;

  // Fetch the data from the last month column
  const lastMonthData = row[lastMonthIndex];

  // If the last month's data exists and is a string, process it
  if (lastMonthData && typeof lastMonthData === 'string') {
    // Split the last month's data into individual worksheets
    const worksheets = lastMonthData.split(',').map((ws) => ws.trim());

    // Iterate through the worksheets to find the last valid level
    for (let j = worksheets.length - 1; j >= 0; j--) {
      const worksheet = worksheets[j].match(/^\d*[A-Za-z]/)?.[0]; // Extract the level
      if (worksheet && levels.includes(worksheet)) {
        return worksheet; // Return the latest valid level
      }
    }
  }

  // If no valid level is found, return an empty string
  return '';
};

// Function to count sheet repetitions
const countSheetRepetitions = (row, monthColumns, startIndex) => {
  const levels = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
  const sheetRepetitions = new Array(levels.length).fill(0);

  // Iterate through month columns
  monthColumns.forEach((_, index) => {
    const monthData = row[startIndex + index];
    if (monthData && typeof monthData === 'string') {
      levels.forEach((level, levelIndex) => {
        if (monthData.includes(level)) {
          sheetRepetitions[levelIndex]++;
        }
      });
    }
  });

  return sheetRepetitions;
};

// Function to calculate accuracy
const calculateAccuracy = (row, monthColumns, startIndex) => {
  const totalMonths = monthColumns.length; // Total months of data
  if (totalMonths === 0) return 0;

  let accurateMonths = 0;

  // Iterate through month columns
  monthColumns.forEach((_, index) => {
    const monthData = row[startIndex + index];
    if (monthData && typeof monthData === 'string') {
      accurateMonths++;
    }
  });

  return ((accurateMonths / totalMonths) * 100).toFixed(2);
};

// Function to add conditional formatting
const addConditionalFormatting = (sheet, data) => {
  const levels = ['7A', '6A', '5A', '4A', '3A', '2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
  const accuracyIndex = data[0].indexOf('Accuracy (%)');

  // Apply formatting for worksheet counts (4 and above)
  levels.forEach((level, index) => {
    const columnIndex = 10 + index; // Columns start from index 10
    data.slice(1).forEach((row, rowIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex });
      const value = row[columnIndex];

      if (value >= 4) {
        sheet[cellAddress].s = { fill: { fgColor: { rgb: 'FFCCCB' } } }; // Lighter red for 4 and above
      }
    });
  });

  // Apply formatting for accuracy
  data.slice(1).forEach((row, rowIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: accuracyIndex });
    const accuracy = parseFloat(row[accuracyIndex]);

    if (accuracy > 80) { // Over 80%
      sheet[cellAddress].s = { fill: { fgColor: { rgb: '90EE90' } } }; // Green for good accuracy
    }
  });
};