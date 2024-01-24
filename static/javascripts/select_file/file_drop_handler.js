// Handle dropping files into folder
const dropArea = document.getElementById('drop-zone')

function handleDragEnter() {
    dropArea.classList.add('dragover');
}

function handleDragLeave() {
    dropArea.classList.remove('dragover');
}

function handleDragOver(e) {
    e.preventDefault();
    handleDragEnter();
}

function handleDrop(e) {
    e.preventDefault();
    handleDragLeave();

    // Check if the drop occurred on the zone or its children
    if (dropArea.contains(e.target)) {
        handleDroppedFiles(e);  // Accept dropped files
    }
}

function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isValidFile(filename) {
    const allowedExtensions = [".xlsx", ".ods", ".csv"];
    if (!filename)
        return false;  // Empty or undefined is invalid
    const fileExtension = getFileExtension(filename);
    return allowedExtensions.includes(fileExtension);
}

function handleDroppedFiles(event) {
    const droppedFiles = Array.from(event.dataTransfer.files);

    const files = droppedFiles.filter((file) => { isValidFile(file.name) })  // Drop files with invalid extensions

    // Create a FormData object
    const formData = new FormData();
    files.forEach((file, index) => {
        formData.append(`file${index}`, file)
    });

    fetch('/file/upload', {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            if (response.ok) {
                console.log('Files added successfully');
                // TODO: Add files to view
            } else {
                console.error("Server didn't receive files.");
            }
        })
        .catch(error => {
            console.error(`These files weren't added successfully ${files}\n${error}`);
        });
}

// Attach event listeners
document.addEventListener('dragenter', handleDragEnter);
document.addEventListener('dragleave', handleDragLeave);
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);