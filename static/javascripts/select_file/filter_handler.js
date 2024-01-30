function handleFilterSubmit(event) {
    // Think of a way to store data along side html tags in client
}

function handleFilterDelete(event) {

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