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
      fetch('https://script.google.com/macros/s/AKfycbxIVtztuWNKInuqp6qZYrgFfdhoNVkgDuqHDFhObQm8OJZ2FocLAJd_o8zgPeb2gAa-/exec', {
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
