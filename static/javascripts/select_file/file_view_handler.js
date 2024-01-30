function handleEdit(event) {
    // TODO: Edit will allow you to open the file's spreadsheet in edit mode
    // TODO: Pop up a rename window to rename the file
}

function handleQueryList(event) {
    const fileViewDiv = getFileView(event);
    const fileName = getFileName(event);

    const data = JSON.stringify({ filename: fileName });
    fetch("filter/get", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    })
        .then(response => {
            if (!response.ok)
                throw new Error('Failed to retrieve filters');

            return response.json();
        })
        .then(json => {
            // Populate filters div using json data.
            const filtersContainerDiv = populateFilters(JSON.parse(json), fileName);

            // position at fileViewDiv, set as child and in styles make absolute position.
            fileViewDiv.appendChild(filtersContainerDiv);
        })
}

function handleDownload(event) {
    const fileName = getFileName(event.target);
    const data = JSON.stringify({ filename: fileName });

    console.log(`${fileName} is being downloaded`);

    fetch('/file/get', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    })
        .then(request => {
            if (!request.ok)
                throw new Error("Failed to fetch file");

            return request.blob();
        })
        .then(blob => {
            // Handle the Blob data, for example, create a URL for downloading
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error(error));
}

function handleDelete(event) {
    const fileViewDiv = getFileView(event.target);
    const fileName = getFileName(event.target);

    const choice = confirm(`Are you sure you want to remove ${fileName}`);
    if (!choice)
        return;  // User cancelled action

    const data = JSON.stringify({ filename: fileName });

    fetch('/file/delete', {
        method: "POST",
        headers:
        {
            "Content-Type": "application/json",
        },
        body: data
    })
        .then(response => {
            if (!response.ok)
                throw new Error("Failed deleting file");

            return response.json();
        })
        .then(json => {
            console.log(json["message"]);
            fileViewDiv.parentElement.removeChild(fileViewDiv);  // Remove div
        })
        .catch(error => {
            console.error(error);
        })
}

function getFileView(view) {
    // Return file view from a member of the buttons container
    // TODO: maybe find a better way to fetch parent?
    // file-view>ButtonsContainer>Buttons
    const fileViewDiv = view.parentElement.parentElement;
    return fileViewDiv;
}

function getFileName(view) {
    // View must be a member of buttons container
    const filenameDiv = getFileView(view);
    const filename = filenameDiv.dataset.filename;

    return filename;
}

function populateFilters(filters, fileName) {
    // From the filters list return a div wrapper of the filters.
    const filtersContainerDiv = document.createElement('div');
    filtersContainerDiv.classList.add('filters-container');

    fetch('templates/select_file/filter_item.html')
        .then(response => {
            if (!response.ok)
                throw new Error("Failed to retrieve filter item template");

            return response.text();
        })
        .then(content => {
            filters.forEach(filter => {
                const filterItem = document.createElement('div');
                filterItem.classList.add('filter-item');
                filterItem.innerHTML = content;

                const tableColumns = getTableColumns();

                // Populate column selector
                const columnSelect = filterItem.querySelector('select[name="column"]');
                tableColumns.forEach(item => {
                    const optionElement = document.createElement('option');
                    optionElement.value = item;
                    optionElement.textContent = item;
                    columnSelect.appendChild(optionElement);
                })
                columnSelect.value = filter.column;

                const methodSelect = filterItem.querySelector('select[name="method"]');
                methodSelect.value = filter.method;

                const inputField = filterItem.querySelector('input[name="input"]');
                inputField.textContent = filter.input;

                filtersContainerDiv.appendChild(filterItem);
            })
        })
        .catch(error => console.error(error));
}