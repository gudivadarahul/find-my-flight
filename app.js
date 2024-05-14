// Get the airline input and list elements
const airlineInput = document.getElementById("airline");
const airlineList = document.getElementById("airlineList");

let airlines = [];

async function fetchAirlines() {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "https://api.amadeus.com/v1/reference-data/airlines",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    airlines = data.data.map((airline) => ({
      name: airline.businessName || airline.commonName,
      iataCode: airline.iataCode,
    }));
  } else {
    console.error("Failed to fetch airlines");
  }
}

// Function to filter airlines based on user input
function filterAirlines() {
  const searchTerm = airlineInput.value.toLowerCase();
  const filteredAirlines = airlines.filter((airline) =>
    airline.name.toLowerCase().startsWith(searchTerm)
  );
  displayAirlines(filteredAirlines);
}

function displayAirlines(airlines) {
  airlineList.innerHTML = "";
  airlines.forEach((airline, index) => {
    const li = document.createElement("li");
    li.textContent = airline.name;
    li.dataset.iataCode = airline.iataCode;
    li.classList.add("list-group-item");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");
    li.addEventListener("click", () => {
      airlineInput.value = airline.name;
      airlineInput.dataset.iataCode = airline.iataCode;
      airlineList.style.display = "none";
      airlineList.querySelectorAll("li").forEach((item) => {
        item.setAttribute("aria-selected", "false");
      });
      li.setAttribute("aria-selected", "true");
    });
    airlineList.appendChild(li);
  });
  airlineList.style.display = airlines.length > 0 ? "block" : "none";
}

// Event listener for hiding the dropdown when clicking outside
document.addEventListener("click", (event) => {
  if (!event.target.matches("#airline, #airlineList *")) {
    airlineList.style.display = "none";
  }
});


fetchAirlines();

// Get form and flight status elements
const flightForm = document.getElementById("flight-form");
const flightStatus = document.getElementById("flight-status");

// Add listener for form submission
flightForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Prevent form submission

  const airline = airlineInput.dataset.iataCode;
  const flightNumber = document.getElementById("flight-number").value;
  const departureDate = document.getElementById("departure-date").value;

  if (!airline || !flightNumber || !departureDate) {
    displayError("Please fill in all fields.");
    return;
  }

    // Show a loading spinner
    flightStatus.innerHTML = `
    <div class="d-flex justify-content-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  // Get the access token
  const accessToken = await getAccessToken();

  // Make an API request to retrieve flight status
  fetch(
    `https://api.amadeus.com/v2/schedule/flights?carrierCode=${airline}&flightNumber=${flightNumber}&scheduledDepartureDate=${departureDate}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      // Extract the departure and arrival times from the response
      const departureTime =
        data.data[0].flightPoints[0].departure.timings[0].value;
      const arrivalTime = data.data[0].flightPoints[1].arrival.timings[0].value;

      // Format the departure and arrival times
      const formattedDepartureTime = formatDateTime(departureTime);
      const formattedArrivalTime = formatDateTime(arrivalTime);

      // Display the formatted departure and arrival times
      flightStatus.innerHTML = `
      <div class="d-flex justify-content-between">
        <div>
          <h5>Departure Time</h5>
          <p>${formattedDepartureTime}</p>
        </div>
        <div>
          <h5>Arrival Time</h5>
          <p>${formattedArrivalTime}</p>
        </div>
      </div>
    `;
    })
    .catch((error) => {
      // Handle any errors
      displayError("An error occurred. Please try again.");
      console.error("Error:", error);
    });
});

function displayError(message) {
  const errorAlert = document.createElement("div");
  errorAlert.classList.add("alert", "alert-danger", "mt-3");
  errorAlert.textContent = message;
  flightStatus.innerHTML = "";
  flightStatus.appendChild(errorAlert);
}

// Function to format date and time
function formatDateTime(dateTimeString) {
  const dateTime = new Date(dateTimeString);
  const options = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneName: "short",
  };
  return dateTime.toLocaleString("en-US", options);
}

// Function to get access token
async function getAccessToken() {
  const apiKey = "7nrCxveITNNGPGGQVKmoj3HagcITDk1n";
  const apiSecret = "cGXeh6cAy6Ler2FY";

  const response = await fetch(
    "https://api.amadeus.com/v1/security/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("Access token data:", data);
  return data.access_token;
}
