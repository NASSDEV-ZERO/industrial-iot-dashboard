const socket = io();

const MAX_POINTS = 20;
const VIBRATION_LIMIT = 20;

// --------------------------------------
// DOM elements
// --------------------------------------

const vibrationValue =
    document.getElementById("vibrationValue");

const temperatureValue =
    document.getElementById("temperatureValue");

const statusBadge =
    document.getElementById("statusBadge");

const statusDescription =
    document.getElementById("statusDescription");

const statusCard =
    document.getElementById("statusCard");

const vibrationBar =
    document.getElementById("vibrationBar");

const alertTable =
    document.getElementById("alertTable");

const noAlerts =
    document.getElementById("noAlerts");

const alertCount =
    document.getElementById("alertCount");

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");


// --------------------------------------
// Historical data
// --------------------------------------

const labels = [];
const vibrationData = [];
const temperatureData = [];

let alertEvents = [];


// --------------------------------------
// Chart configuration
// --------------------------------------

const ctx =
    document.getElementById("motorChart").getContext("2d");

const motorChart = new Chart(ctx, {

    type: "line",

    data: {
        labels,

        datasets: [

            {
                label: "Vibration",

                data: vibrationData,

                borderColor: "#22d3ee",

                backgroundColor: "rgba(34, 211, 238, 0.08)",

                borderWidth: 2,

                pointRadius: 3,

                pointHoverRadius: 5,

                tension: 0.35,

                fill: true,

                yAxisID: "vibrationAxis"
            },

            {
                label: "Temperature",

                data: temperatureData,

                borderColor: "#fbbf24",

                backgroundColor: "rgba(251, 191, 36, 0.05)",

                borderWidth: 2,

                pointRadius: 3,

                pointHoverRadius: 5,

                tension: 0.35,

                fill: false,

                yAxisID: "temperatureAxis"
            }

        ]
    },

    options: {

        responsive: true,

        maintainAspectRatio: false,

        animation: {
            duration: 300
        },

        interaction: {
            intersect: false,
            mode: "index"
        },

        plugins: {

            legend: {
                display: false
            },

            tooltip: {
                backgroundColor: "#020617",
                borderColor: "#334155",
                borderWidth: 1,
                padding: 12
            }
        },

        scales: {

            x: {
                grid: {
                    color: "rgba(148, 163, 184, 0.08)"
                },

                ticks: {
                    color: "#64748b",
                    maxRotation: 0
                }
            },

            vibrationAxis: {

                type: "linear",

                position: "left",

                beginAtZero: true,

                grid: {
                    color: "rgba(148, 163, 184, 0.08)"
                },

                ticks: {
                    color: "#22d3ee"
                },

                title: {
                    display: true,
                    text: "Vibration (m/s²)",
                    color: "#22d3ee"
                }
            },

            temperatureAxis: {

                type: "linear",

                position: "right",

                beginAtZero: true,

                grid: {
                    drawOnChartArea: false
                },

                ticks: {
                    color: "#fbbf24"
                },

                title: {
                    display: true,
                    text: "Temperature (°C)",
                    color: "#fbbf24"
                }
            }
        }
    }
});


// --------------------------------------
// Socket connection
// --------------------------------------

socket.on("connect", () => {

    connectionDot.className =
        "w-2.5 h-2.5 rounded-full bg-green-400 " +
        "shadow-[0_0_10px_#4ade80]";

    connectionText.textContent =
        "Connected";
});


socket.on("disconnect", () => {

    connectionDot.className =
        "w-2.5 h-2.5 rounded-full bg-red-500";

    connectionText.textContent =
        "Disconnected";
});


// --------------------------------------
// Receive ESP32 data
// --------------------------------------

socket.on("sensorData", (data) => {

    updateMetrics(data);

    updateChart(data);

    if (data.alert) {
        addAlert(data);
    }
});


// --------------------------------------
// Update metric cards
// --------------------------------------

function updateMetrics(data) {

    vibrationValue.textContent =
        Number(data.vibration).toFixed(2);

    temperatureValue.textContent =
        Number(data.temperature).toFixed(1);


    // Vibration progress bar
    const percentage =
        Math.min(
            (data.vibration / VIBRATION_LIMIT) * 100,
            100
        );

    vibrationBar.style.width =
        `${percentage}%`;


    // Machine status
    const isWarning =
        data.alert ||
        String(data.status).toUpperCase() !== "OK";

    if (isWarning) {

        statusBadge.textContent =
            "WARNING / ALERT";

        statusBadge.className =
            "inline-flex items-center px-5 py-2.5 " +
            "rounded-xl text-lg font-bold " +
            "bg-red-500/10 text-red-400 " +
            "border border-red-500/30 " +
            "animate-pulse shadow-neonRed";

        statusDescription.textContent =
            "Abnormal motor condition detected";

        statusCard.className =
            "bg-slate-900 border border-red-500/40 " +
            "rounded-2xl p-5 shadow-neonRed";

        vibrationBar.className =
            "h-full bg-red-500 transition-all duration-500";

    } else {

        statusBadge.textContent =
            "NORMAL";

        statusBadge.className =
            "inline-flex items-center px-5 py-2.5 " +
            "rounded-xl text-lg font-bold " +
            "bg-green-500/10 text-green-400 " +
            "border border-green-500/30 " +
            "shadow-neonGreen";

        statusDescription.textContent =
            "Motor operating normally";

        statusCard.className =
            "bg-slate-900 border border-slate-800 " +
            "rounded-2xl p-5 shadow-lg";

        vibrationBar.className =
            "h-full bg-cyan-400 transition-all duration-500";
    }
}


// --------------------------------------
// Update chart
// --------------------------------------

function updateChart(data) {

    const time =
        new Date(data.timestamp || Date.now())
            .toLocaleTimeString();

    labels.push(time);

    vibrationData.push(
        Number(data.vibration)
    );

    temperatureData.push(
        Number(data.temperature)
    );


    // Keep only last 20 points
    if (labels.length > MAX_POINTS) {
        labels.shift();
        vibrationData.shift();
        temperatureData.shift();
    }

    motorChart.update("none");
}


// --------------------------------------
// Add alert to table
// --------------------------------------

function addAlert(data) {

    if (noAlerts) {
        noAlerts.remove();
    }

    const timestamp =
        new Date(data.timestamp || Date.now());

    const row =
        document.createElement("tr");

    row.className =
        "hover:bg-slate-800/40 transition";


    const timeCell =
        document.createElement("td");

    timeCell.className =
        "px-5 py-3 text-slate-400 whitespace-nowrap";

    timeCell.textContent =
        timestamp.toLocaleString();


    const vibrationCell =
        document.createElement("td");

    vibrationCell.className =
        "px-5 py-3 font-semibold text-red-400";

    vibrationCell.textContent =
        `${Number(data.vibration).toFixed(2)} m/s²`;


    const statusCell =
        document.createElement("td");

    statusCell.className =
        "px-5 py-3";

    statusCell.innerHTML =
        `
        <span class="
            inline-flex
            px-2.5 py-1
            rounded-full
            text-xs
            font-medium
            bg-red-500/10
            text-red-400
            border
            border-red-500/20
        ">
            VIBRATION ALERT
        </span>
        `;


    row.appendChild(timeCell);
    row.appendChild(vibrationCell);
    row.appendChild(statusCell);


    alertTable.prepend(row);


    alertEvents.push({
        timestamp,
        vibration: data.vibration
    });


    // Keep last 10 alerts
    if (alertEvents.length > 10) {

        alertEvents.shift();

        if (alertTable.lastElementChild) {
            alertTable.lastElementChild.remove();
        }
    }


    alertCount.textContent =
        `${alertEvents.length} alert` +
        `${alertEvents.length === 1 ? "" : "s"}`;
}