const form = document.getElementById('submit-room');
const summaryError = document.getElementById('form-summary-error');
const formAction = form.getAttribute('action');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const urlEncodedData = new URLSearchParams(formData);
    
    const buttonMessage = document.getElementById('button-message');
    const loadIndicator = document.getElementById('loading-spinner')

    try {
        hideElement(buttonMessage);
        showElement(loadIndicator);

        const response = await fetch(formAction, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
            body: urlEncodedData
        }).finally(() => {
            hideElement(loadIndicator);
            showElement(buttonMessage);
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = result.redirectUrl;
        } else {
            if (result.errors) {
                displayError(result.errors);
                return;
            }
            displayError("Error processing the request. Status code: ", response.status);
            return;
        }
    } catch (error) {
        console.error('Network error:', error);
        displayError("Error connecting to server");
    }
});

// TODO finish selecting roomcode ones
document.querySelectorAll('input#roomcode').forEach(input => {
    input.addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
})

function displayError(errors) {
    if (typeof(errors) === 'string') {
        summaryError.textContent = errors;
        return;
    }
    [...document.querySelectorAll('input')]
        .some(input => {
            const error = errors[input.id];
            if (error) {
                summaryError.textContent = error;
                return true;
            }
            return false;
        });
}
