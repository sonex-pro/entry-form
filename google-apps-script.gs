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
    
    // Check if sheet has any data first
    let headers = [];
    if (sheet.getLastColumn() > 0) {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    Logger.log('Current headers: %s', JSON.stringify(headers));
    
    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      // Define specific column order: name first, email second, then other fields
      const newHeaders = ['name', 'email'];
      
      // Add any other fields that aren't name or email
      Object.keys(data).forEach(key => {
        if (key !== 'name' && key !== 'email' && !newHeaders.includes(key)) {
          newHeaders.push(key);
        }
      });
      
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
    const newRow = sheet.appendRow(rowData);
    

    Logger.log('Data successfully appended to sheet');
    
    // Create a user-friendly HTML success page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Entry Submitted Successfully</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 90%; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center;
            background-color: #f5f5f5;
          }
          .success-container {
            background-color: #4CAF50;
            color: white;
            padding: 40px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          h1 { margin-top: 0; }
          .details {
            background-color: white;
            color: #333;
            padding: 20px;
            margin-top: 20px;
            border-radius: 5px;
            text-align: left;
          }

        </style>
      </head>
      <body>
        <div class="success-container">
          <h1>🏓 Entry Submitted Successfully!</h1>
          <p><strong>Your entry for the BATTS Open 1-Star Tournament has been successfully submitted!</strong></p>
          <p>To secure your place in the tournament, please complete the bank transfer to Batts Table Tennis Club.</p>
          <p>Bank details can be found in the entry form</p>
          <p><strong>Thank you, and good luck!</strong></p>
          
          <div class="details">
            <h3>Submission Details:</h3>
            <p><strong>Entry Number:</strong> ${sheet.getLastRow() - 1}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Name:</strong> ${data.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${data.email || 'Not provided'}</p>
          </div>
          
        </div>
      </body>
      </html>
    `;
    
    var response = HtmlService.createHtmlOutput(htmlContent)
      .setTitle('Entry Submitted Successfully');
    
    return setCorsHeaders(response);
    
  } catch (error) {
    Logger.log('Error occurred: %s', error.toString());
    Logger.log('Error stack: %s', error.stack);
    // Create a user-friendly HTML error page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Submission Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 90%; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center;
            background-color: #f5f5f5;
          }
          .error-container {
            background-color: #f44336;
            color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          h1 { margin-top: 0; }
          .contact-info {
            background-color: white;
            color: #333;
            padding: 20px;
            margin-top: 20px;
            border-radius: 5px;
            text-align: left;
          }
          .close-btn {
            background-color: #d32f2f;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>⚠️ Submission Error</h1>
          <p><strong>Sorry, there was an error processing your tournament entry.</strong></p>
          <p>Please try submitting again, or contact the organizer if the problem persists.</p>
          
          <div class="contact-info">
            <h3>Contact Information:</h3>
            <p><strong>Organizer:</strong> Carl Johnson (TTE Level 1 coach)</p>
            <p><strong>Phone:</strong> 07469 844024</p>
            <p><strong>Email:</strong> carl.johnson.batts@gmail.com</p>
          </div>
          
        </div>
      </body>
      </html>
    `;
    
    var response = HtmlService.createHtmlOutput(htmlContent)
      .setTitle('Submission Error');
    
    return setCorsHeaders(response);
  }
}

function setCorsHeaders(response) {
  // For ContentService.createTextOutput(), we don't need to set CORS headers
  // as they're not needed for direct form submissions
  // Just return the response as-is
  return response;
}


