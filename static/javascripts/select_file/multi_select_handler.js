// Selecting files and multi-select
const maxSelectedViews = 2;  // How many can be selected at once
let selectedViews = [];

function handleSelect(event) {
    const imgElement = event.target;
    if (imgElement.classList.contains('selected-file'))
        deselectImg(imgElement);
    else
        selectImg(imgElement, event.shiftKey);


    // Ensure only one event listener is active.
    document.removeEventListener("keyup", handleMultiSelect);
    if (selectedViews.length > 0)
        document.addEventListener("keyup", handleMultiSelect);
}

function handleMultiSelect(event) {
    if (event.shiftKey)
        return;  // Shift key is still held

    if (selectedViews.length < 2)
        return;  // multiple were not selected yet.

    // Shift key has been released

    // Get file names
    const selectedFiles = selectedViews.map(view => view.parentElement.querySelector('p').textContent)

    // Deselect all files
    selectedViews.forEach(view => deselectImg(view));

    showOptions(selectedFiles);
}

function selectImg(img, shiftKey) {
    // Make room for the view if over the maximum limit (FIFO style)

    if (shiftKey) {
        if (selectedViews.length == maxSelectedViews)
            deselectImg(selectedViews[0]);
    }
    else {
        // Deselect all, multi-select ended
        selectedViews.forEach(view => deselectImg(view));
        // TODO: Open file on spreadsheet, pass filename to spreadsheet view
    }

    img.classList.add('selected-file');
    selectedViews.push(img);  // Add to array

    fetch("/resources/images/excel_logo_opened.svg")
        .then(response => {
            if (!response.ok)
                throw new Error('Failed to fetch excel logo opened');

            return response.text();
        })
        .then(content => {
            // Create a data URL from the SVG content
            const dataUrl = "data:image/svg+xml," + encodeURIComponent(content);

            img.setAttribute("src", dataUrl);
            img.setAttribute("alt", "Excel logo opened")
        }).catch(error => {
            console.error('Error fetching opened Excel logo:', error);
        });
}

function deselectImg(img) {
    img.classList.remove('selected-file');
    // Remove from array
    selectedViews = selectedViews.filter(item => item !== img);

    fetch("/resources/images/excel_logo_closed.svg")
        .then(response => {
            if (!response.ok)
                throw new Error('Failed to fetch excel logo closed');

            return response.text();
        })
        .then(content => {
            // Create a data URL from the SVG content
            const dataUrl = "data:image/svg+xml," + encodeURIComponent(content);

            img.setAttribute("src", dataUrl);
            img.setAttribute("alt", "Excel logo closed")
        }).catch(error => {
            console.error('Error fetching closed Excel logo:', error);
        });
}

function showOptions(filenames) {
    console.log(`Selected items: ${filenames.join(', ')}`);

    // Make sure only one exists.
    const old = document.querySelector('options-box');

    if (old)
        old.parentElement.removeChild(old);

    fetch("/templates/select_file/selection_box.html")
        .then(response => {
            if (!response.ok)
                throw new Error("Failed to fetch selection box");

            return response.text();
        })
        .then(content => {
            const optionsBox = document.createElement('div');
            optionsBox.innerHTML = content;

            document.body.appendChild(optionsBox)
            document.addEventListener("click", closeOptions);

            // TODO: add event listener for submit, populate selectors for columns
        })
        .catch(error => console.error(error));
}

function closeOptions(event) {
    let optionsBox = document.getElementsByClassName("options-box");
    if (!optionsBox)
        return;  // Non found

    optionsBox = optionsBox[0];

    if (event.target === optionsBox || optionsBox.contains(event.target))
        return; // clicked inside, ignore.

    // Clicked outside, close optionsBox.
    optionsBox.parentElement.removeChild(optionsBox);
    document.removeEventListener("click", closeOptions);
}