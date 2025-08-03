// Google Apps Script integration for form submission
document.addEventListener('DOMContentLoaded', function() {
  const entryForm = document.getElementById('entryForm');
  
  if (entryForm) {
    entryForm.addEventListener('submit', function(event) {
      // Don't prevent default - let the form submit naturally to Google Apps Script
      
      // Show loading indicator
      const submitButton = document.querySelector('input[type="submit"]');
      if (submitButton) {
        submitButton.value = "Submitting...";
        submitButton.disabled = true;
      }
      
      // Show success message after form submits
      setTimeout(() => {
        document.querySelector('.form-container').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        window.scrollTo(0, 0);
      }, 2000);
    });
  }
});
