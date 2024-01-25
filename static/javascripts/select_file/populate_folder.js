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
            const paragraphDiv = fileViewDiv.querySelector('p');
            paragraphDiv.textContent = file.name;

            return fileViewDiv
        })
        .catch(error => console.error(error));
}