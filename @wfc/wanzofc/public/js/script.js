// script.js
document.addEventListener('DOMContentLoaded', function () {
    console.log('WFC App Frontend Initialized!');

    // Example: Add a class to focused input fields for more visual feedback
    const allInputs = document.querySelectorAll('input.form-control, textarea.form-control');
    allInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.classList.add('is-focused');
        });
        input.addEventListener('blur', function() {
            this.classList.remove('is-focused');
        });
    });

    // Example: Tooltip initialization if you use them
    // var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    //   return new bootstrap.Tooltip(tooltipTriggerEl)
    // })
});