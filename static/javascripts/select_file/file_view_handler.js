function handleEdit(event) {

}

function handleQueryList(event) { }

function handleDownload(event) { }

function handleDelete(event) { }


function getFilename(view) {
    // View must be a member of buttons container
    const filenameDiv = view.parentElement.querySelector('p.file-name');
    const filename = filenameDiv.textContent;

    return filename
}