function redirect_selection() {
    // Get selected file
    let selectedFile = document.querySelector('.file-item.selected-file');

    if (selectedFile !== null)
        window.location.href = `{{url_for("home")}}?selectedFile=${encodeURIComponent(selectedFile.textContent)}`;
    else
        window.location.href = '{{url_for("home")}}';
}