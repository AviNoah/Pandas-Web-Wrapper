// Get reference to spreadsheet element div
const spreadsheetElement = document.getElementById('spreadsheet');

// Get reference to the selected sheet spinner element
const selectedSheetSpinner = document.getElementById('sheetSelector');
selectedSheetSpinner.addEventListener('change', changeSheet);

// Function to handle changes in the selected sheet spinner
function changeSheet() {
    // Make a GET request
    fetch('/selected_file').then(response => {
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
        filterImg.alt = 'Filter';
        filterImg.classList.add("filter");

        // Fetch src
        fetch('/resources/images/Filter.svg')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not retrieve filter src");
                }
                return response.url; // Return the URL from the response
            })
            .then(imageUrl => {
                // Set the src attribute of the image element
                filterImg.src = imageUrl;
            })
            .catch(error => console.error('Error fetching image:', error));



        const cellName = document.createTextNode(cell.textContent);

        wrapperDiv.appendChild(cellName);
        wrapperDiv.appendChild(filterImg);

        // Clear the original content and append the wrapper div
        cell.innerHTML = '';
        cell.appendChild(wrapperDiv);

        // Apply filter when the filter image is clicked
        filterImg.addEventListener('click', () => addFilter(cell.cellIndex + 1)); // Add 1 to cellIndex to adjust for 0-based index
    });
}

function escapeRegExp(string) {
    // Escape regex
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Function to create a filter popup element
function createFilterPopup(filename, columnIndex) {
    // Check if a filter popup already exists and remove it
    const existingPopup = document.querySelector('.filter-popup');
    if (existingPopup) {
        existingPopup.parentNode.removeChild(existingPopup);
    }

    // Create a filter popup element
    const filterPopup = document.createElement('div');
    filterPopup.className = 'filter-popup';

    fetch('/spreadsheet/filter/popup').then(response => {
        if (!response.ok) {
            console.error("Failed to fetch filterPopup html file");
            return null;
        }
        return response.text();
    })
        .then(content => {
            filterPopup.innerHTML = content;
            document.body.appendChild(filterPopup);

            // Make the filter submit button run process_input every time it is clicked
            document.getElementById('filter_submit_button').addEventListener('click', () => applyFilter(filename, columnIndex));
        }).catch(error => console.error(error))

    return filterPopup;
}


// Function to handle closing the filter popup
function closeFilterPopup(event) {
    const filterPopup = document.querySelector('.filter-popup');

    // Check if the clicked element or its parent is outside the filter popup
    if (!filterPopup)
        return;  // Not initialized yet

    if (
        (event.target.classList.contains('selected') || event.target.parentElement.classList.contains('selected')) &&
        !filterPopup.contains(event.target)
    ) {
        // Filter icon was selected again, don't close popup
        return;
    }

    if (event.target !== filterPopup && !filterPopup.contains(event.target)) {
        filterPopup.style.display = 'none';
        document.removeEventListener('click', closeFilterPopup);
    }
}


function addFilter(column) {
    //TODO: get filename
    const filename = null
    createFilterPopup(filename, column);
    document.addEventListener('click', (event) => closeFilterPopup(event));
}

function applyFilter(filename, column) {
    // Get the selected filter type
    const selection = document.getElementById('filter_selector').value;

    // Get the filter input value
    const patternInput = document.getElementById('filter_input').value;

    console.log(`Pattern input is: ${patternInput} for selection ${selection} on column ${columnIndex}`)

    const escapedPatternInput = escapeRegExp(patternInput);

    const data = { 'filename': filename, 'column': column, 'method': selection, 'input': escapedPatternInput };

    // Save new filter
    fetch("/spreadsheet/filter", {
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

            changeSheet();  // Update sheet with new filter
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

function openFile(file, filename = null) {
    if (file) {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const data = event.target.result;  // Result of file read
                const workbook = XLSX.read(data, { type: 'binary' })

                // Always start on the first page
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                updateSpreadsheetElement(sheet);

                // Adjust the spinner based on the number of sheets
                adjustSpinner(workbook.SheetNames.length);

                if (!filename) filename = file.filename;  // Fall back if not given filename

                // Save file name to sessionStorage.
                sessionStorage.setItem('selected-file', filename);
                console.log(sessionStorage.getItem('selected-file'))
            } catch (error) {
                console.error("Error reading the Excel file:", error);
            }
        }

        reader.readAsBinaryString(file);
    }
}

// Function to adjust the selected sheet spinner properties
function adjustSpinner(sheetCount) {
    // Set the value to 1 and change the maximum value to sheet count
    selectedSheetSpinner.value = 1;
    selectedSheetSpinner.max = sheetCount;
}


// TODO: Remove test file later
document.addEventListener('DOMContentLoaded', function (event) {
    fetch("/spreadsheet/upload/test_file")
        .then(response => {
            if (!response.ok) {
                throw new Error('Test file was not retrieved');
            }
            if (!response.headers.has('File-Name'))
                throw new Error("File name was not specified in headers");

            const filename = response.headers.get('File-Name');
            console.log(filename);
            return response.blob();  // Extract response as blob
        })
        .then(blob => {
            openFile(blob);
        })
        .catch(error => {
            console.error('Error fetching the test file:', error);
        });
});
