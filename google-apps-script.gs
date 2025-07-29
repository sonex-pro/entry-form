function doOptions(e) {
  var response = ContentService.createTextOutput(
    JSON.stringify({ status: "success", data: "Options handled" })
  ).setMimeType(ContentService.MimeType.JSON);
  
  response.appendHeader('Access-Control-Allow-Origin', 'https://sonex-pro.github.io');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.appendHeader('Access-Control-Max-Age', '3600');
  
  return response;
}

// Adding explicit doGet function for testing CORS
function doGet(e) {
  var response = ContentService.createTextOutput(
    JSON.stringify({ status: "success", data: "GET handled", params: e.parameter })
  ).setMimeType(ContentService.MimeType.JSON);
  
  return setCorsHeaders(response);
}

function doPost(e) {
  try {
    const data = e.parameter;
    
    Logger.log('Received data: %s', JSON.stringify(data));
    Logger.log('Data keys: %s', JSON.stringify(Object.keys(data)));
    Logger.log('Data values: %s', JSON.stringify(Object.values(data)));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Current headers: %s', JSON.stringify(headers));
    
    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      const newHeaders = Object.keys(data);
      newHeaders.push("timestamp");
      Logger.log('Creating new headers: %s', JSON.stringify(newHeaders));
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      sheet.setFrozenRows(1);
      headers = newHeaders;
    }
    
    const rowData = headers.map(header => {
      if (header === "timestamp") return new Date().toISOString();
      return data[header] || "";
    });
    
    Logger.log('Row data to append: %s', JSON.stringify(rowData));
    sheet.appendRow(rowData);
    Logger.log('Data successfully appended to sheet');
    
    var response = ContentService.createTextOutput(
      JSON.stringify({ 
        result: "success", 
        message: "Data successfully recorded",
        debug: {
          receivedKeys: Object.keys(data),
          rowCount: sheet.getLastRow(),
          timestamp: new Date().toISOString()
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
    
  } catch (error) {
    Logger.log('Error occurred: %s', error.toString());
    Logger.log('Error stack: %s', error.stack);
    var response = ContentService.createTextOutput(
      JSON.stringify({ 
        result: "error", 
        message: error.toString(),
        stack: error.stack,
        debug: {
          receivedData: e.parameter ? Object.keys(e.parameter) : 'No parameter data',
          timestamp: new Date().toISOString()
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
  }
}

function setCorsHeaders(response) {
  // Allow your GitHub Pages domain explicitly
  response.appendHeader('Access-Control-Allow-Origin', 'https://sonex-pro.github.io');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Access-Control-Max-Age', '3600');
  return response;
}


