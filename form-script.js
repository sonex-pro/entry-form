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
      // Using URLSearchParams to avoid CORS preflight (simple request)
      const urlParams = new URLSearchParams();
      Object.keys(formDataObj).forEach(key => {
        urlParams.append(key, formDataObj[key]);
      });
      
      fetch('https://script.google.com/macros/s/AKfycbwLuasa0Y6EnNM_lyPQ8geURtX636P4LMNKhehH2GzAdfVYerogdR1a4ktRZJQ2C2ih/exec', {
        method: 'POST',
        body: urlParams
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
