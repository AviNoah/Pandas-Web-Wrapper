// A script to show the files that were added to the back-end.
const folderDiv = document.getElementById("drop-zone")

export function addFiles(files) {
    // Add files to the folders div
    files.forEach((file) => {
        const fileView = addFileView(file);
        folderDiv.appendChild(fileView);
    })
}

function addFileView(file) {
    // Make file-view
    fetch("/templates/select_file/file_view.html")
        .then(response => {
            if (!response.ok)
                throw new console.error("Failed fetching file view template");

            return response;
        })
        .then(() => {
            // Update file name
            const filename = file.name;
            // TODO: update p tag's textContent with filename
        })
        .catch(error => console.error(error));
}