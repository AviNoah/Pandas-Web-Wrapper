// A script to show the files that were added to the back-end.
const folderDiv = document.getElementById("drop-zone")

export function addFiles(files) {
    // Add files to the folders div
    files.forEach((file) => addFileView(folderDiv, file));
}

function addFileView(container, file) {
    const fileViewDiv = document.createElement('div');

    // Make file-view
    fetch("/templates/select_file/file_view.html")
        .then(response => {
            if (!response.ok)
                throw new console.error("Failed fetching file view template");

            return response.text();
        })
        .then((content) => {
            fileViewDiv.innerHTML = content;

            // Update file name
            const paragraphDiv = fileViewDiv.querySelector('p.full-file-name');

            const fileNameSpan = paragraphDiv.querySelector('span.file-name');
            fileNameSpan.textContent = getFileName(file.name);

            const fileExtSpan = paragraphDiv.querySelector('span.file-ext');
            fileExtSpan.textContent = "." + getFileExtension(file.name);

            const tooltipDiv = fileViewDiv.querySelector('span.tooltip');
            tooltipDiv.textContent = file.name;

            container.appendChild(fileViewDiv);
        })
        .catch(error => console.error(error));
}

// Don't allow any image from the folder to be dragged.
folderDiv.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'IMG')
        event.preventDefault();
})


export function getFileName(filename) {
    const parts = filename.split('.');
    const name = parts.slice(0, -1).join('.');
    return name;
}

export function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}