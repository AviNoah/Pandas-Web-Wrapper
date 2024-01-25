import { addFileView } from "./file_view_handler.js";

// A script to show the files that were added to the back-end.
const folderDiv = document.getElementById("drop-zone")

export function addFiles(files) {
    // Add files to the folders div
    files.forEach((file) => {
        const fileView = addFileView(file);
        folderDiv.appendChild(fileView);
    })
}