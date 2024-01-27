function handleEdit(event) {
    // TODO: Edit will allow you to open the file's spreadsheet in edit mode
}

function handleQueryList(event) { }

function handleDownload(event) { }

function handleDelete(event) {
    event.target.parentElement
}


function getFileView(view) {
    // Return file view from a member of the buttons container
    const fileViewDiv = view.parentElement.parentElement
    return fileViewDiv
}

function getFileName(view) {
    // View must be a member of buttons container
    const filenameDiv = getFileView(view).querySelector('p.file-name');
    const filename = filenameDiv.textContent;

    return filename
}