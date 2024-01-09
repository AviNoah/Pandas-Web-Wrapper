// notification.js

// Function to extract the value of the 'notification' parameter from the URL
function getNotification() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('notification');
}

// Function to display a notification using window.alert
function displayNotification() {
    const notification = getNotification();
    if (notification) {
        // Use window.alert to display the notification
        window.alert(notification);
    }
}
// Call the displayNotification function when the page loads
window.onload = displayNotification;