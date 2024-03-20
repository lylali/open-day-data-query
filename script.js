async function fetchEventData() {
    try {
        const response = await fetch('OpenDay.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch the event data: ", error);
    }
}

// Set the theme of the webpage
function setTheme(data) {
    const headerSection = document.getElementById('headerSection');
    headerSection.style.backgroundImage = `url('${data.cover_image}')`;
    document.getElementById('eventHeadline').innerText = data.description;
    document.getElementById('eventDates').innerText = `${data.start_time} - ${data.end_time}`;
}

// Populate filters for locations and program types
function populateFilters(topics) {
    const locations = new Set();
    const programTypes = new Set();

    topics.forEach(topic => {
        topic.programs.forEach(program => {
            locations.add(program.location.title);
            programTypes.add(program.programType.type);
        });
    });

    const locationSelect = document.getElementById('locationSelect');
    locationSelect.add(new Option("All", "All", true, true)); // Add "All" option for locations
    locations.forEach(location => {
        locationSelect.add(new Option(location, location));
    });

    const programTypeSelect = document.getElementById('programTypeSelect');
    programTypeSelect.add(new Option("All", "All", true, true)); // Add "All" option for program types
    programTypes.forEach(type => {
        programTypeSelect.add(new Option(type, type));
    });
}

// Global variables for pagination
let currentPage = 1;
const eventsPerPage = 5;
let currentFilteredTopics = [];
let totalEvents = 0;

// Initialization with Flattened Programs
function flattenTopicsToPrograms(topics) {
    let flattenedPrograms = [];
    topics.forEach(topic => {
        topic.programs.forEach(program => {
            // Optionally, you could add topic information to each program if needed
            flattenedPrograms.push({...program, topicTitle: topic.title});
        });
    });
    return flattenedPrograms;
}


// Populate events based on the current page and filters applied
function populateEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = ''; // Clear existing events

    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const paginatedPrograms = currentFilteredTopics.slice(startIndex, endIndex);

    paginatedPrograms.forEach(program => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card-header">${program.title}</div>
            <div class="event-card-body">
                <div class="event-info"><span>Description:</span> ${program.description}</div>
                <div class="event-info"><span>Start Time:</span> ${program.start_time}</div>
                <div class="event-info"><span>End Time:</span> ${program.end_time}</div>
                <div class="event-info"><span>Location:</span> ${program.location.title}</div>
            </div>
        `;
        eventsContainer.appendChild(card);
    });

    updatePaginationControls();
}


// Update pagination controls based on the currentFilteredTopics
function updatePaginationControls() {
    const totalPages = Math.ceil(totalEvents / eventsPerPage);
    document.getElementById('currentPage').innerText = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// sort event 
function sortEvents(programs, sortOrder) {
    return programs.sort((a, b) => {
        const dateA = new Date(a.start_time);
        const dateB = new Date(b.start_time);
        return sortOrder === 'earliest' ? dateA - dateB : dateB - dateA;
    });
}


// Filter events based on location and program type
function filterEvents(programs, selectedLocation, selectedProgramType) {
    return programs.filter(program => {
        const locationMatch = selectedLocation === 'All' || program.location.title === selectedLocation;
        const programTypeMatch = selectedProgramType === 'All' || program.programType.type === selectedProgramType;
        return locationMatch && programTypeMatch;
    });
}


// Add event listeners for pagination controls
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        populateEvents();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(totalEvents / eventsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        populateEvents();
    }
});

// Main event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch event data and set the theme of the page
    const data = await fetchEventData();
    setTheme(data);

    // Populate filters with options derived from the complete dataset
    populateFilters(data.topics);

    // Flatten the topics into a single list of programs for initial display
    currentFilteredTopics = flattenTopicsToPrograms(data.topics);
    totalEvents = currentFilteredTopics.length; // Update the total number of events

    populateEvents(); // Populate the event cards for the initial page load

    // Sorting functionality
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', () => {
        currentPage = 1; // Reset to the first page on sort change
        currentFilteredTopics = sortEvents(currentFilteredTopics, sortSelect.value);
        populateEvents();
    });

    // Filtering by Location
    const locationSelect = document.getElementById('locationSelect');
    locationSelect.addEventListener('change', () => {
        currentPage = 1; // Reset to the first page on filter change
        // Re-apply sorting to the original dataset, then filter
        let sortedTopics = sortEvents(flattenTopicsToPrograms(data.topics), sortSelect.value);
        currentFilteredTopics = filterEvents(sortedTopics, locationSelect.value, programTypeSelect.value);
        totalEvents = currentFilteredTopics.length; // Update total events after filtering
        populateEvents();
    });

    // Filtering by Program Type
    const programTypeSelect = document.getElementById('programTypeSelect');
    programTypeSelect.addEventListener('change', () => {
        currentPage = 1; // Reset to the first page on filter change
        // Re-apply sorting to the original dataset, then filter
        let sortedTopics = sortEvents(flattenTopicsToPrograms(data.topics), sortSelect.value);
        currentFilteredTopics = filterEvents(sortedTopics, locationSelect.value, programTypeSelect.value);
        totalEvents = currentFilteredTopics.length; // Update total events after filtering
        populateEvents();
    });

    // Pagination controls
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            populateEvents();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(totalEvents / eventsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            populateEvents();
        }
    });
});



function calculateTotalEvents() {
    return currentFilteredTopics.length;
}


