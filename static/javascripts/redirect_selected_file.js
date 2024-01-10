function redirect_selection() {
    // Get selected file
    let selectedFile = document.querySelector('.file-item.selected-file');

    if (selectedFile !== null)
        window.location.href = `${home_folder}?selectedFile=${encodeURIComponent(selectedFile.textContent)}`;
    else
        window.location.href = home_folder;
}