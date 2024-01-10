// get_selected_file.js

// Retrieve the ?selectedFile parameter query from url

function get_selected_file() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('selectedFile');
}

var selectedValue = get_selected_file()

if (selectedValue !== null) {
    // Send to process selection
    fetch('/process_selection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selection: selectedValue }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response from server:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}