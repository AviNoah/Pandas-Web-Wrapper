import { showOptions } from "./multi_select_handler.js";

const maxSelectedViews = 2;  // How many can be selected at once
let selectedViews = [];

function handleEdit(event) { }

function handleQueryList(event) { }

function handleDownload(event) { }

function handleDelete(event) { }

function handleSelect(event) {
    const imgElement = event.target;
    if (imgElement.classList.contains('selected-file'))
        deselectImg(imgElement);
    else
        selectImg(imgElement);


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

function selectImg(img) {
    // Make room for the view if over the maximum limit (FIFO style)
    if (selectedViews.length == maxSelectedViews)
        deselectImg(selectedViews[0]);

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