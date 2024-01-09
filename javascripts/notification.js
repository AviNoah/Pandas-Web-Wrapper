// notification.js

// Function to extract the value of the 'notification' parameter from the URL
function getNotification() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('notification');
}

// Function to display a notification using system.alert
function displayNotification() {
    const notification = getNotification();
    if (notification) {
        // Use system.alert to display the notification
        system.alert(notification);
    }
}
