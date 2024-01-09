// fileDisplay.js

// Function to dynamically display files
function displayFiles() {
    const fileListContainer = document.getElementById('file-list');

    // Access files variable passed from render_template
    const fileData = {{ files | tojson | safe
}};

if (fileListContainer) {
    fileData.forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.classList.add('file-item');

        const iconImg = document.createElement('img');
        iconImg.src = `{{ url_for('static', filename='images/') }}${file.icon}`;
        iconImg.alt = 'Excel Icon';

        const fileName = document.createElement('p');
        fileName.textContent = file.name;

        fileDiv.appendChild(iconImg);
        fileDiv.appendChild(fileName);

        fileListContainer.appendChild(fileDiv);
    });
}
}

// Call the displayFiles function when the page loads
window.onload = displayFiles;
