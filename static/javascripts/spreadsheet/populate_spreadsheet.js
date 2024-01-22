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

function applyFilter(column)
{
    // TODO: Implement this to POST the added filter to back-end.
}