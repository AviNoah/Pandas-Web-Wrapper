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

function isValidFile(filename) {
    const allowedExtensions = [".xlsx", ".ods", ".csv"];

    // Get the file extension
    const fileExtension = filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

    // Check if the file extension is in the list of allowed extensions
    return allowedExtensions.includes("." + fileExtension.toLowerCase());
}

function handleDroppedFiles(event) {
    let files = Array.from(event.dataTransfer.files);

    files = files.filter((file) => isValidFile(file.filename))  // Drop files with invalid extensions

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