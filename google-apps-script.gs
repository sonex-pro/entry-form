function doOptions(e) {
  var response = ContentService.createTextOutput(
    JSON.stringify({ status: "success", data: "Options handled" })
  ).setMimeType(ContentService.MimeType.JSON);
  
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      const newHeaders = Object.keys(data);
      newHeaders.push("timestamp");
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      sheet.setFrozenRows(1);
      headers = newHeaders;
    }
    
    const rowData = headers.map(header => {
      if (header === "timestamp") return new Date().toISOString();
      return data[header] || "";
    });
    
    sheet.appendRow(rowData);
    
    var response = ContentService.createTextOutput(
      JSON.stringify({ result: "success", message: "Data successfully recorded" })
    ).setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
    
  } catch (error) {
    var response = ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(response);
  }
}

function setCorsHeaders(response) {
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

