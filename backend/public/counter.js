// counter.js
// PURPOSE: This module will keep count of successful translated images.
// Instead of showing a counter value, we will display a progress bar that updates as we increment the count.
// We will use a count to keep track of the number of successful translations and update the progress bar accordingly.
// These will then tie into the frontend to visually represent progress.
// We use the count to track progress (e.g 5, 10, 15, etc.) and update the progress bar width based on this count.
// Once at a 100, we can cash in our progress for rewards (e.g power up goku, unlock new characters)
// Notes:
// - export keyword is used to make functions available outside this module.

let count = 0; // Initialize count variable to keep track of successful translations

// ----------------------------------------
// Increment the count by 1 
// ----------------------------------------
export function incrementCount() {
    count += 5;
    updateProgressBar();
}

// ----------------------------------------
// Get the current count value
// ----------------------------------------
export function getCount() {
    return count;
}

// ----------------------------------------
// Update the progress bar based on the current count
//
// Notes:
// Div based progress bar with id 'progress-bar' is assumed to be present in the HTML.
// ----------------------------------------
function updateProgressBar(count) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${Math.min(count, 100)}%`;
}

