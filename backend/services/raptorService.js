const Stop = require('../models/stopsModel');
const Route = require('../models/routesModel');
const Trip = require('../models/tripsModel');
const StopTime = require('../models/stopTimesModel');
const Transfer = require('../models/transfersModel');
const PriorityQueue = require('js-priority-queue');

const findFastestPath = async (originId, destinationId, departureTime) => {
    try {
        console.log(`\n=== Finding Fastest Path ===`);
        console.log(`From: ${originId} To: ${destinationId}`);

        // Fetch and check stops
        const originStop = await Stop.findOne({ stop_id: originId });
        const destinationStop = await Stop.findOne({ stop_id: destinationId });

        if (!originStop || !destinationStop) {
            console.error("❌ Error: One or both stops not found in the database.");
            return { success: false, message: "Invalid origin or destination stop." };
        }

        console.log(`✅ Origin Stop: ${originStop.stop_name}, Destination Stop: ${destinationStop.stop_name}`);

        // Convert departure time to minutes
        const departureTimeInMinutes = convertTimeToMinutes(departureTime);
        console.log("✅ Departure time in minutes:", departureTimeInMinutes);

        let arrivalTimes = new Map();
        let previousStops = new Map();
        let closedSet = new Set();

        // Initialize priority queue
        const openSet = new PriorityQueue({ comparator: (a, b) => a.fCost - b.fCost });
        openSet.queue({ stopId: originId, gCost: departureTimeInMinutes, fCost: departureTimeInMinutes });
        arrivalTimes.set(originId, departureTimeInMinutes);
        previousStops.set(originId, null);

        while (openSet.length > 0) {
            const { stopId, gCost } = openSet.dequeue();

            if (closedSet.has(stopId)) continue;
            if (stopId === destinationId) return reconstructPath(previousStops, stopId, departureTime, gCost);
            closedSet.add(stopId);

            // Process Stop Times
            const stopTimes = await StopTime.find({ stop_id: stopId }).populate({ path: 'trip_id', populate: { path: 'route_id' } });
            if (stopTimes.length === 0) {
                console.warn(`⚠️ No stop times found for stop ${stopId}`);
            }
            for (const stopTime of stopTimes) {
                console.log(`🚆 Processing trip ${stopTime.trip_id.trip_id} at stop ${stopId} - Arrival: ${stopTime.arrival_time}`);
                processNeighbor(stopTime.stop_id, stopTime.arrival_time, stopId, gCost, openSet, arrivalTimes, previousStops);
            }

            // Process Transfers
            const transfers = await Transfer.find({ from_stop_id: stopId });
            for (const transfer of transfers) {
                processNeighbor(transfer.to_stop_id, gCost + transfer.min_transfer_time, stopId, gCost, openSet, arrivalTimes, previousStops);
            }
        }

        console.error("❌ No route found between", originId, "and", destinationId);
        return { success: false, message: 'No route found' };
    } catch (error) {
        console.error('🚨 Error in findFastestPath:', error);
        return { success: false, message: 'Error occurred while finding route', error };
    }
};

// Process each neighboring stop
const processNeighbor = (neighborId, arrivalTime, currentStop, currentCost, openSet, arrivalTimes, previousStops) => {
    const arrivalTimeInMinutes = convertTimeToMinutes(arrivalTime);
    if (isNaN(arrivalTimeInMinutes)) {
        console.error(`❌ Skipping invalid time for stop ${neighborId}: ${arrivalTime}`);
        return;
    }
    const newGCost = currentCost + arrivalTimeInMinutes;
    if (!arrivalTimes.has(neighborId) || newGCost < arrivalTimes.get(neighborId)) {
        arrivalTimes.set(neighborId, newGCost);
        previousStops.set(neighborId, currentStop);
        openSet.queue({ stopId: neighborId, gCost: newGCost, fCost: newGCost });
    }
};

// Reconstruct the path from destination to origin
const reconstructPath = (previousStops, destination, departureTime, arrivalTime) => {
    let path = [];
    let current = destination;
    while (current) {
        path.unshift(current);
        current = previousStops.get(current);
    }
    return { success: true, route: path, departureTime, arrivalTime: convertMinutesToTime(arrivalTime) };
};

// Convert HH:MM:SS format to minutes
const convertTimeToMinutes = (time) => {
    if (typeof time === 'number') {
        return time; // Already in minutes, return as-is
    }
    if (typeof time !== 'string') {
        console.error("❌ Invalid time format received:", time);
        return NaN;
    }

    const timeParts = time.split(':').map(Number);
    if (timeParts.length < 2 || timeParts.length > 3) {
        console.error("⚠️ Error: Time format should be HH:MM or HH:MM:SS.");
        return NaN;
    }

    const [hours, minutes, seconds = 0] = timeParts;
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error("❌ Error parsing time:", time);
        return NaN;
    }

    return hours * 60 + minutes + (seconds / 60);
};

// Convert minutes to HH:MM:SS format
const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.round((minutes % 1) * 60);
    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

module.exports = { findFastestPath };