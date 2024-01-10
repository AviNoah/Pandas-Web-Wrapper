// fileDisplay.js

// Function to dynamically display files
function displayFiles() {

    // Get file list container
    const fileListContainer = document.getElementById('file-list');

    if (typeof fileData === 'undefined')
        throw Error("filesData is not defined or was not passed to script correctly");

    if (typeof image_folder === "undefined")
        throw Error("image_folder is not defined or was not passed to script correctly");

    if (fileListContainer) {
        fileData.forEach(file => {
            // The div to hold the image and file name text
            const fileDiv = document.createElement('div');
            fileDiv.classList.add('file-item');

            // Create image
            const iconImg = document.createElement('img');
            iconImg.src = `${image_folder}${file.icon}_closed.png`;
            iconImg.alt = 'Excel Icon';

            // Shrink image
            iconImg.width = 128;
            iconImg.height = 128;

            // Create paragraph
            const fileName = document.createElement('p');
            fileName.textContent = file.name;

            // Add event listener for file selection, and add glow effect to selected
            fileDiv.addEventListener('click', () => {
                // Remove mark and glow effect from all files
                document.querySelectorAll('.file-item').forEach(item => {
                    item.classList.remove('selected-file');
                    // Set iconImg child's img source to closed excel logo
                    var img_child = item.querySelector('img')
                    img_child.src = `${image_folder}${file.icon}_closed.png`;
                });

                // Mark and add glow effect to the selected file
                fileDiv.classList.add('selected-file');
                // Set iconImg child's img source to closed excel logo
                img_child.src = `${image_folder}${file.icon}_opened.png`;

            });

            // Append children
            fileDiv.appendChild(iconImg);
            fileDiv.appendChild(fileName);

            fileListContainer.appendChild(fileDiv);
        });
    }
}

// Call the displayFiles function when the page loads
window.onload = displayFiles;
