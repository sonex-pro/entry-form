# Tournament Entry Form

A web form that collects tournament entry information and sends it to a Google Sheet.

## Setup Instructions

### Google Apps Script Setup

1. Create a new Google Sheet to store form responses
2. In the Google Sheet, go to Extensions > Apps Script
3. Paste the Google Apps Script code (see below)
4. Deploy as a web app:
   - Click "Deploy" > "New deployment"
   - Select type: "Web app"
   - Description: "Tournament Entry Form Handler"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Authorize the app when prompted
   - Copy the web app URL

### Local Setup

1. Clone this repository
2. Create a `form-script.js` file (it's excluded from Git for security)
3. Add the following code to `form-script.js`, replacing the URL with your Google Apps Script URL:

```javascript
// Google Apps Script integration for form submission
document.addEventListener('DOMContentLoaded', function() {
  const entryForm = document.getElementById('entryForm');
  
  if (entryForm) {
    entryForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Show loading indicator or message
      const submitButton = document.querySelector('input[type="submit"]');
      const originalButtonText = submitButton.value;
      submitButton.value = "Submitting...";
      submitButton.disabled = true;
      
      // Collect form data
      const formData = new FormData(entryForm);
      const formDataObj = {};
      
      // Process form data, ensuring checkboxes are properly handled
      formData.forEach((value, key) => {
        // For checkboxes, we want to set "true" as the value when checked
        const element = document.querySelector(`[name="${key}"]`);
        if (element && element.type === 'checkbox') {
          formDataObj[key] = element.checked ? "true" : "false";
        } else {
          formDataObj[key] = value;
        }
      });
      
      // Send data to Google Apps Script Web App
      fetch('YOUR_GOOGLE_APPS_SCRIPT_URL_HERE', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataObj),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        
        // Show success message
        document.querySelector('.form-container').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        window.scrollTo(0, 0);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('There was an error submitting your form. Please try again or contact the organizer.');
        
        // Reset submit button
        submitButton.value = originalButtonText;
        submitButton.disabled = false;
      });
    });
  }
});
```

## Google Apps Script Code

Paste this code into your Google Apps Script editor:

```javascript
// Google Apps Script to receive form data and save to Google Sheet
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Form Responses') || ss.insertSheet('Form Responses');
    
    // Define the expected column headers based on your requirements
    const headers = [
      'name', 'phone', 'email', 'tte', 'other', 'club', 'county', 'dob', 
      'disability', 'PPadult_name', 'PPguardian_name', 'guardian_antidoping', 
      'undertaking_agree', 'consent', 'final_agreement'
    ];
    
    // Check if headers are already set in the sheet
    if (sheet.getRange('A1').isBlank()) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Prepare row data in the correct order
    const rowData = headers.map(header => {
      // For checkbox fields, ensure they show as "true" when checked
      if (['undertaking_agree', 'consent', 'final_agreement'].includes(header)) {
        return data[header] || "false";
      }
      return data[header] || "";
    });
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Data successfully saved to Google Sheet'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify the script is working
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'active',
    'message': 'The Google Apps Script is running correctly'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

## Testing

1. Fill out the form
2. Submit the form
3. Check your Google Sheet for the submitted data
