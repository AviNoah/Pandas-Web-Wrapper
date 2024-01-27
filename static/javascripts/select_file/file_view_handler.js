function handleEdit(event) {
    // TODO: Edit will allow you to open the file's spreadsheet in edit mode
}

function handleQueryList(event) { }

function handleDownload(event) { }

function handleDelete(event) {
    const fileViewDiv = getFileView(event.target);
    const fileName = getFileName(event.target);

    const choice = confirm(`Are you sure you want to remove ${fileName}`);
    if (!choice)
        return;  // User cancelled action

    const data = JSON.stringify({ filename: fileName });

    fetch('/file/delete', {
        method: "POST",
        headers:
        {
            "Content-Type": "application/json",
        },
        body: data
    })
        .then(response => {
            if (!response.ok)
                throw new Error("Failed deleting file");

            return response.json();
        })
        .then(json => {
            console.log(json["message"]);
            fileViewDiv.parentElement.removeChild(fileViewDiv);  // Remove div
        })
        .catch(error => {
            console.error(error);
        })
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