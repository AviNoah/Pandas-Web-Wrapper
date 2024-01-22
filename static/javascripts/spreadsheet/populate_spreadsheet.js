// Get reference to the selected sheet spinner element
const selectedSheetSpinner = document.getElementById('sheetSelector');
selectedSheetSpinner.addEventListener('change', changeSheet);

// Function to handle changes in the selected sheet spinner
function changeSheet() {
    // Make a GET request
    fetch('selected_file').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return response.arrayBuffer();  // Extract response as arrayBuffer
    }).then(buffer => {
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'binary' });

        // Adjust for 0-based index
        const sheetIndex = selectedSheetSpinner.value - 1;

        const sheetName = workbook.SheetNames[sheetIndex];
        const sheet = workbook.Sheets[sheetName];

        // Update the spreadsheet element
        updateSpreadsheetElement(sheet);
    }).catch(error => console.error("Error while parsing selected workbook :", error))
}