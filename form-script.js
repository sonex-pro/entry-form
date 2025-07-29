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
      submitButton.textContent = 'Submitting...';
      
      // Show success message after a brief delay
      setTimeout(() => {
        document.querySelector('.form-container').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        window.scrollTo(0, 0);
      }, 1000);
    });
  }
});
