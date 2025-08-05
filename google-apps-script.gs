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
      // Define specific column order: name, gender, tte number, club, county, email, phone, disability
      const newHeaders = ['name', 'gender', 'tte number', 'club', 'county', 'email', 'phone', 'disability'];
      
      // Add any other fields that aren't in the predefined order
      Object.keys(data).forEach(key => {
        if (!newHeaders.includes(key)) {
          newHeaders.push(key);
        }
      });
      
      newHeaders.push("timestamp");
      Logger.log('Creating new headers: %s', JSON.stringify(newHeaders));
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      sheet.setFrozenRows(1);
      headers = newHeaders;
    }
    
    // Check for duplicate email before adding new data
    const emailToCheck = data.email;
    if (emailToCheck) {
      const emailColumnIndex = headers.indexOf('email');
      if (emailColumnIndex !== -1 && sheet.getLastRow() > 1) {
        // Get all existing emails (skip header row)
        const existingEmails = sheet.getRange(2, emailColumnIndex + 1, sheet.getLastRow() - 1, 1).getValues();
        const emailExists = existingEmails.some(row => row[0] && row[0].toString().toLowerCase() === emailToCheck.toLowerCase());
        
        if (emailExists) {
          Logger.log('Duplicate email blocked: %s', emailToCheck);
          
          // Simple response to prevent refresh-based resubmissions
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Entry Already Submitted</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  max-width: 600px; 
                  margin: 50px auto; 
                  padding: 20px; 
                  text-align: center;
                  background-color: #f5f5f5;
                }
                .info-container {
                  background-color: #2196F3;
                  color: white;
                  padding: 30px 20px;
                  border-radius: 10px;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                h1 { margin-top: 0; }
                p { font-size: 16px; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="info-container">
                <h1>🏓 Entry Already Submitted</h1>
                <p><strong>This email address has already been used for an entry.</strong></p>
                <p>Your tournament entry is already in our system.</p>
                <p>Please close this tab to avoid duplicate submissions.</p>
              </div>
            </body>
            </html>
          `;
          
          var response = HtmlService.createHtmlOutput(htmlContent)
            .setTitle('Entry Already Submitted');
          
          return setCorsHeaders(response);
        }
      }
    }
    
    const rowData = headers.map(header => {
      if (header === "timestamp") return new Date().toISOString();
      
      // Convert gender values
      if (header === "gender") {
        const genderValue = data[header];
        if (genderValue === "male") return "M";
        if (genderValue === "female") return "F";
        return genderValue || "";
      }

      return data[header] || "";
    });
    
    Logger.log('Row data to append: %s', JSON.stringify(rowData));
    const newRow = sheet.appendRow(rowData);
    
    // Apply purple formatting to 'F' entries in gender column
    const genderColumnIndex = headers.indexOf('gender');
    if (genderColumnIndex !== -1 && data.gender === 'female') {
      const currentRow = sheet.getLastRow();
      const genderCell = sheet.getRange(currentRow, genderColumnIndex + 1);
      genderCell.setFontColor('#ff0000'); // Red color
    }

    Logger.log('Data successfully appended to sheet');
    
    // Send confirmation email if email is provided
    if (data.email) {
      try {
        sendConfirmationEmail(data);
        Logger.log('Confirmation email sent to: %s', data.email);
      } catch (emailError) {
        Logger.log('Failed to send confirmation email: %s', emailError.toString());
        // Continue with success page even if email fails
      }
    }
    
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
          <p>📧 <strong>A confirmation email has been sent to your email address</strong> with all the tournament details and payment information.</p>
          <p>To secure your place in the tournament, please complete the bank transfer to Batts Table Tennis Club.</p>
          <p>Bank details can be found in the entry form</p>
          <p><strong>Thank you, and good luck!</strong></p>
          
          <div class="details">
            <h3>Submission Details:</h3>
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

function sendConfirmationEmail(data) {
  const subject = '🏓 BATTS Open 1-Star Tournament - Entry Confirmation';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: #4CAF50; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🏓 Entry Confirmed!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">BATTS Open 1-Star Tournament</p>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Sunday 2nd November 2025</p>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.name || 'Player'},</p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for entering the <strong>BATTS Open 1-Star Tournament</strong>! Your entry has been successfully received and recorded.</p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">📋 Your Entry Details:</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name || 'Not provided'}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email || 'Not provided'}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
          <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-GB')}</p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">💳 Important: Payment Required</h3>
          <p style="color: #856404; margin: 5px 0;">To secure your place in the tournament, please complete the bank transfer:</p>
          <p style="color: #856404; margin: 5px 0;"><strong>Account:</strong> Batts Table Tennis Club</p>
          <p style="color: #856404; margin: 5px 0;"><strong>Sort Code:</strong> 77-13-10</p>
          <p style="color: #856404; margin: 5px 0;"><strong>Account Number:</strong> 23166968</p>
          <p style="color: #856404; margin: 5px 0;"><strong>Reference:</strong> Your name + "1Star"</p>
          <p style="color: #856404; margin: 5px 0;"><strong>Amount:</strong> £35</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">📅 Tournament Information:</h3>
          <p style="color: #1976d2; margin: 5px 0;"><strong>Date:</strong> Sunday 2nd November 2025</p>
          <p style="color: #1976d2; margin: 5px 0;"><strong>Venue:</strong> Batts Table Tennis Club</p>
          <p style="color: #1976d2; margin: 5px 0;"><strong>Address:</strong> Norman Booth Centre, Harlow, Essex. CM17 0EY</p>
          <p style="color: #1976d2; margin: 5px 0;"><strong>Registration:</strong> 8:15 AM</p>
          <p style="color: #1976d2; margin: 5px 0;"><strong>Play Starts:</strong> 9:15 AM</p>
          <p style="color: #1976d2; margin: 5px 0;"><strong>We will only contact you if payment is not received</strong></p>
        </div>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">If you have any questions or need to make changes to your entry, please contact the organizer:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Organizer:</strong> Carl Johnson</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> 07469 844024</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> carl.johnson.batts@gmail.com</p>
        </div>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Good luck with your preparation, and I look forward to seeing you at the tournament!</p>
        
        <p style="font-size: 16px; color: #333; margin-top: 30px;">Best regards,<br>
        <strong style="font-family: Georgia, serif;">Carl</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `
BATS Open 1-Star Tournament - Entry Confirmation

Dear ${data.name || 'Player'},

Thank you for entering the BATTS Open 1-Star Tournament! Your entry has been successfully received.

Your Entry Details:
- Name: ${data.name || 'Not provided'}
- Email: ${data.email || 'Not provided'}
- Phone: ${data.phone || 'Not provided'}
- Submitted: ${new Date().toLocaleString('en-GB')}

IMPORTANT - Payment Required:
To secure your place, please complete the bank transfer to:
- Account: Batts Table Tennis Club
- Sort Code: 77-13-10
- Account Number: 23166968
- Reference: Your name + "1Star"
- Amount: £35.00
- Maximum 48 entries accepted in order of receipt and payment
- We will only contact you if payment is not received.

Tournament Information:
- Date: Sunday 2nd November 2025
- Venue: Batts Table Tennis Club
- Address: Norman Booth Centre, Harlow, Essex. CM17 0EY
- Registration from: 8:15 AM
- Play Starts: 9:15 AM

Contact Information:
- Organiser: Carl Johnson
- Phone: 07469 844024
- Email: carl.johnson.batts@gmail.com

Good luck with your preparation!

Best regards,
Carl
  `;
  
  // Send the email
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody,
    body: textBody
  });
}

function setCorsHeaders(response) {
  // For ContentService.createTextOutput(), we don't need to set CORS headers
  // as they're not needed for direct form submissions
  // Just return the response as-is
  return response;
}


