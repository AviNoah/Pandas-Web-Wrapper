// Get reference to spreadsheet element div
const spreadsheetElement = document.getElementById('spreadsheet');

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

function updateSpreadsheetElement(sheet, editable = false) {
    // Convert sheet data to HTML with grid lines
    const html = XLSX.utils.sheet_to_html(sheet, { editable: editable, showGridLines: true });

    // Display the HTML in the spreadsheet div
    spreadsheetElement.innerHTML = html;

    // Mark header rows as header-cell
    const firstRowCells = spreadsheetElement.querySelectorAll('tr:first-child td');
    firstRowCells.forEach(cell => {
        cell.classList.add('header-cell');

        // Create a wrapper div for proper spacing
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('wrapper')

        // Design header cell
        const filterImg = document.createElement('img');
        filterImg.src = '../static/images/filter_logo.svg';
        filterImg.alt = 'Filter';
        filterImg.classList.add("filter");


        const cellName = document.createTextNode(cell.textContent);

        wrapperDiv.appendChild(cellName);
        wrapperDiv.appendChild(filterImg);

        // Clear the original content and append the wrapper div
        cell.innerHTML = '';
        cell.appendChild(wrapperDiv);

        // Apply filter when the filter image is clicked
        filterImg.addEventListener('click', () => applyFilter(cell.cellIndex + 1)); // Add 1 to cellIndex to adjust for 0-based index
    });
}


function escapeRegExp(string) {
    // Escape regex
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function applyFilter(column) {
    // Get the selected filter type
    const selection = document.getElementById('filter_selector').value;

    // Get the filter input value
    const patternInput = document.getElementById('filter_input').value;

    console.log(`Pattern input is: ${patternInput} for selection ${selection} on column ${columnIndex}`)

    const escapedPatternInput = escapeRegExp(patternInput);

    const data = { 'filename': null, 'column': column, 'method': selection, 'input': escapedPatternInput };

    //TODO add to data filename

    fetch("/filters", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            // Check if it's successful
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            // Log the response data
            console.log(responseData);
        })
        .catch(error => {
            // Handle errors
            console.error("Error:", error);
        });
}