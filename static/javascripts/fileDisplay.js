// fileDisplay.js

// Function to dynamically display files
function displayFiles() {

    // Get file list container
    const fileListContainer = document.getElementById('file-list');

    // Access files variable passed from render_template
    const fileData = JSON.parse(files)

    if (fileListContainer) {
        fileData.forEach(file => {
            // The div to hold the image and file name text
            const fileDiv = document.createElement('div');
            fileDiv.classList.add('file-item');

            // Create image
            const iconImg = document.createElement('img');
            iconImg.src = `{{ url_for('static', filename='images/') }}${file.icon}`;
            iconImg.alt = 'Excel Icon';

            // Create paragraph
            const fileName = document.createElement('p');
            fileName.textContent = file.name;

            // Append children
            fileDiv.appendChild(iconImg);
            fileDiv.appendChild(fileName);

            fileListContainer.appendChild(fileDiv);
        });
    }
}

// Call the displayFiles function when the page loads
window.onload = displayFiles;
