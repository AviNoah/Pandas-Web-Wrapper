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

function handleDroppedFiles(event) {
    const files = Array.from(event.dataTransfer.files);

    // Create a FormData object
    const formData = new FormData();

    // Keep track of file reading with Promises array
    const filePromises = files.map(file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const blob = new Blob([event.target.result]);

                formData.append('files', blob, file.name);

                resolve();
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        })
    );

    Promise.all(filePromises)
        .then(() => {
            console.log(formData);

            return fetch('/file/upload', {
                method: 'POST',
                body: formData,
            });
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
