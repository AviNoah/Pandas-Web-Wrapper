function handleEdit(event) {
    const filename = getFilenameFromView(event.target);

    fetch("/file/rename", {

    })
}

function handleQueryList(event) { }

function handleDownload(event) { }

function handleDelete(event) { }


function getFilenameFromView(view) {
    // View must be a member of buttons container
    const filenameDiv = view.parentElement.querySelector('p.file-name');
    const filename = filenameDiv.textContent;

    return filename
}