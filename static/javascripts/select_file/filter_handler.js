function handleFilterSubmit(event) {
    // Think of a way to store data along side html tags in client
}

function handleFilterDelete(event) {
    const filterItem = getFilterItem(event.target);

    const choice = confirm(`Are you sure you want to remove this filter?`);
    if (!choice)
        return;  // User cancelled action

    const filterID = filterItem.dataset.id;

    const data = JSON.stringify({ filename: fileName }, { filterID: filterID });

    fetch('/filter/delete', {
        method: "POST",
        headers:
        {
            "Content-Type": "application/json",
        },
        body: data
    })
        .then(response => {
            if (!response.ok)
                throw new Error("Failed deleting filter");

            return response.json();
        })
        .then(json => {
            console.log(json["message"]);
            filterItem.parentElement.removeChild(filterItem);  // Remove div
        })
        .catch(error => {
            console.error(error);
        })

}

function getFilterItem(buttonView) {
    // must be a button in buttons container
    return view.parentElement.parentElement;
}

function getFilterContainer(buttonView) {
    return getFilterItem(view).parentElement;
}

function getFilterFileName(buttonView) {
    const filterContainer = getFilterContainer(buttonView);
    return filterContainer.dataset.filename;
}


function populateFilters(filters, fileName) {
    // From the filters list return a div wrapper of the filters.
    const filtersContainerDiv = document.createElement('div');
    filtersContainerDiv.classList.add('filters-container');
    filtersContainerDiv.setAttribute('data-filename', fileName);

    return fetch('templates/select_file/filter_item.html')
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
            return filtersContainerDiv
        })
        .catch(error => console.error(error));
}