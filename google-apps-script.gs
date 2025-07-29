// Google Apps Script to receive form submissions and store in Google Sheets

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  return ContentService.createTextOutput(JSON.stringify({"status":"success", "data": "Options handled"}))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// Set CORS headers for all responses
function setCorsHeaders(response) {
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  return response;
}

function doPost(e) {
  try {
    // Parse the JSON data received from the form
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet(); // Or ss.getSheetByName("Form Responses");
    
    // Get the headers (assuming first row contains headers)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // If no headers exist yet, create them from the incoming data
    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      const newHeaders = Object.keys(data);
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      sheet.setFrozenRows(1); // Freeze the header row
    }
    
    // Prepare the row data in the same order as headers
    const rowData = headers.map(header => data[header] || "");
    
    // Add timestamp if not already included
    if (!headers.includes("timestamp")) {
      headers.push("timestamp");
      sheet.getRange(1, headers.length, 1, 1).setValue("timestamp");
      rowData.push(new Date().toISOString());
    }
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response with CORS headers
    var response = ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Data successfully recorded"
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
    
  } catch (error) {
    // Return error response with CORS headers
    var response = ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
  }
}

// Optional: Add a function to set up the web app properly
function setUp() {
  // This function doesn't need to do anything, but it's useful for deployment
  // When publishing your web app, you'll select this function as the execution function
}
