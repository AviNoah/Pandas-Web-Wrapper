// Get reference to spreadsheet element div
const spreadsheetElement = document.getElementById('spreadsheet');

// Get reference to the selected sheet spinner element
const selectedSheetSpinner = document.getElementById('sheetSelector');
selectedSheetSpinner.addEventListener('change', changeSheet);

// Function to handle changes in the selected sheet spinner
function changeSheet() {
    data = { filename: sessionStorage.getItem("selected-file"), sheet: selectedSheetSpinner.value }

    fetch('/file/get', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return response.blob();  // Return the response as a blob
    }).then(blob => {
        reader = new FileReader();

        reader.onload = function (event) {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const sheetName = workbook.SheetNames[0];  // /file/get returns only one sheet.
            const sheet = workbook.Sheets[sheetName];

            // Update the spreadsheet element
            updateSpreadsheetElement(sheet);
        }

        reader.readAsBinaryString(blob);
        // Return a Promise to maintain the asynchronous behavior
        return Promise.resolve("Changed sheet successfully");
    }).catch(error => console.error("Error while parsing selected workbook :", error));
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
        filterImg.addEventListener('click', (event) => addFilter(event, cell.cellIndex + 1)); // Add 1 to cellIndex to adjust for 0-based index
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

    fetch('/templates/spreadsheet/filter_popup.html').then(response => {
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

function addFilter(event, column) {
    // Show filter pop up at column

    const filename = sessionStorage.getItem('selected-file');
    const filterPopup = createFilterPopup(filename, column);

    // Get the position of the clicked filter image
    const rect = event.target.getBoundingClientRect();

    let right = rect.left + scrollX

    // Make sure it doesn't overflow
    right = Math.max(250, right);

    // Set the position of the filter popup relative to the clicked filter image
    filterPopup.style.position = 'absolute';
    filterPopup.style.right = `${window.innerWidth - right}px`; // Include horizontal scroll
    filterPopup.style.top = `${rect.bottom + window.scrollY}px`; // Include vertical scroll

    filterPopup.style.display = 'block';

    document.addEventListener('click', (event) => closeFilterPopup(event));
}

function applyFilter(filename, column) {
    // Get selected sheet
    const sheetNum = selectedSheetSpinner.value - 1;  // Adjust for 0 based indexing

    // Get the selected filter type
    const selection = document.getElementById('filter_selector').value;

    // Get the filter input value
    const patternInput = document.getElementById('filter_input').value;

    console.log(`Pattern input is: ${patternInput} for selection ${selection} on column ${columnIndex}`)

    const escapedPatternInput = escapeRegExp(patternInput);

    // by default make it enabled because it has been added from the spreadsheet view
    const data = { 'filename': filename, 'sheet': sheetNum, 'column': column, 'method': selection, 'input': escapedPatternInput, 'enabled': true };

    // Save new filter
    fetch("/filter/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            // Check if it's successful
            if (!response.ok) {
                throw new Error(`Failed to add error`);
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

function openFile(filePromise, filename, sheetCount) {
    filePromise.then((file) => {
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
                adjustSpinner(sheetCount);

                // Save file name to sessionStorage.
                sessionStorage.setItem('selected-file', filename);
            } catch (error) {
                console.error("Error reading the Excel file:", error);
            }
        }

        reader.readAsBinaryString(file);
    });
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
            const sheetCount = response.headers.get('Sheet-Count');

            return { blob: response.blob(), filename: filename, sheetCount: sheetCount };  // Extract response as blob
        })
        .then(({ blob, filename, sheetCount }) => {
            openFile(blob, filename, sheetCount);
        })
        .catch(error => {
            console.error('Error fetching the test file:', error);
        });
});
