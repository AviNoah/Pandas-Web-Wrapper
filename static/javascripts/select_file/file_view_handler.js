function handleEdit(event) {
    // TODO: Edit will allow you to open the file's spreadsheet in edit mode
    // TODO: Pop up a rename window to rename the file
}

function handleQueryList(event) {
    const fileViewDiv = getFileView(event);
    const fileName = getFileName(event);

    const data = JSON.stringify({ filename: fileName });
    fetch("filter/get", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    })
        .then(response => {
            if (!response.ok)
                throw new Error('Failed to retrieve filters');

            return response.json();
        })
        .then(json => {
            // Populate filters div using json data.
        })
}

function handleDownload(event) {
    const fileName = getFileName(event.target);
    const data = JSON.stringify({ filename: fileName });

    console.log(`${fileName} is being downloaded`);

    fetch('/file/get', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    })
        .then(request => {
            if (!request.ok)
                throw new Error("Failed to fetch file");

            return request.blob();
        })
        .then(blob => {
            // Handle the Blob data, for example, create a URL for downloading
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error(error));
}

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
    const filename = filenameDiv.dataset.filename;

    return filename
}

function populateFilters(filters) {
    // From the filters json return a div wrapper of the filters.
}