const Stop = require('../models/stopsModel');
const Route = require('../models/routesModel');
const Trip = require('../models/tripsModel');
const StopTime = require('../models/stopTimesModel');
const Transfer = require('../models/transfersModel');
const PriorityQueue = require('js-priority-queue');

const runAstar = async (originId, destinationId, departureTime) => {
    try {
        console.log(`\n=== A* Search Started ===`);
        console.log(`Origin ID: ${originId}, Destination ID: ${destinationId}`);

        // Fetch all stops
        console.log("Fetching all stops...");
        const stops = await Stop.find({});
        const stopIndexMap = new Map(stops.map((stop, index) => [stop.stop_id, index]));

        const INF = Number.MAX_SAFE_INTEGER;

        console.log(`Departure time received: ${departureTime}`);
        const departureTimeInMinutes = convertTimeToMinutes(departureTime);
        console.log(`Converted departure time to minutes: ${departureTimeInMinutes}`);

        let arrivalTimes = new Map();
        let previousStops = new Map();
        let missingTripOrRoute = new Set(); // Track missing trip_id or route_id
        let closedSet = new Set(); // Closed set to track processed stops

        // Initialize the origin stop
        arrivalTimes.set(originId, departureTimeInMinutes);
        previousStops.set(originId, null);

        // Priority queue for A* search
        console.log("Initializing priority queue...");
        const openSet = new PriorityQueue({ comparator: (a, b) => a.fCost - b.fCost });
        openSet.queue({ stopId: originId, gCost: departureTimeInMinutes, fCost: departureTimeInMinutes + heuristic(originId, destinationId), previousStop: null });

        let iterationCount = 0;
        let skippedCount = 0;

        while (openSet.length > 0) {
            iterationCount++;
            const { stopId, gCost, previousStop } = openSet.dequeue();

            console.log(`\nProcessing stop: ${stopId}`);
            console.log(`Current gCost: ${gCost}, fCost: ${gCost + heuristic(stopId, destinationId)}`);

            // Skip if stop is in the closedSet (already fully processed)
            if (closedSet.has(stopId)) {
                console.log(`Skipping stop ${stopId}, already processed.`);
                continue;
            }

            // If destination reached, reconstruct path
            if (stopId === destinationId) {
                let path = [];
                let currentStop = stopId;
                while (currentStop) {
                    path.unshift(currentStop);
                    currentStop = previousStops.get(currentStop);
                }
                console.log('✅ Path found:', path);
                console.log(`🚀 Total iterations: ${iterationCount}`);
                return { success: true, route: path, departureTime, arrivalTime: convertMinutesToTime(gCost) };
            }

            // Mark stop as processed
            closedSet.add(stopId);

            // Skip if we have already processed this stop with a better or equal gCost
            if (arrivalTimes.has(stopId) && arrivalTimes.get(stopId) <= gCost && stopId !== originId) {
                console.log(`Skipping stop ${stopId}, already visited with a better cost.`);
                continue;
            }

            // Update gCost and previousStop only if a better path is found
            arrivalTimes.set(stopId, gCost);
            previousStops.set(stopId, previousStop);

            // Fetch stop times for the current stop
            console.log(`Fetching stop times for stop ${stopId}...`);
            const stopTimes = await StopTime.find({ stop_id: stopId }).populate({
                path: 'trip_id',
                populate: { path: 'route_id' }
            });

            console.log(`Found ${stopTimes.length} stop times for stop ${stopId}`);

            if (stopTimes.length === 0) {
                console.warn(`⚠️ No stop times found for stop ${stopId}. Check stop_times.txt in GTFS data.`);
            }

            for (const stopTime of stopTimes) {
                const trip = stopTime.trip_id;
                const route = trip?.route_id;

                if (!trip || !route) {
                    skippedCount++;
                    if (!missingTripOrRoute.has(stopId)) {
                        console.warn(`⚠️ Skipping stopTime due to missing trip_id or route_id for stop ${stopId}`);
                        missingTripOrRoute.add(stopId);
                    }
                    continue;
                }

                const arrivalTimeInMinutes = convertTimeToMinutes(stopTime.arrival_time);
                const newGCost = gCost + arrivalTimeInMinutes;
                const hCost = heuristic(stopId, destinationId);
                const fCost = newGCost + hCost;

                console.log(`Queuing stop ${stopTime.stop_id} (gCost: ${newGCost}, hCost: ${hCost}, fCost: ${fCost})`);
                openSet.queue({ stopId: stopTime.stop_id, gCost: newGCost, fCost, previousStop: stopId });
            }

            // Fetch transfers for the current stop
            console.log(`Fetching transfers from stop ${stopId}...`);
            const transfers = await Transfer.find({ from_stop_id: stopId });

            console.log(`Found ${transfers.length} transfers from stop ${stopId}`);

            if (transfers.length === 0) {
                console.warn(`⚠️ No transfers found for stop ${stopId}. Check transfers.txt in GTFS data.`);
            }

            for (const transfer of transfers) {
                const fromArrival = arrivalTimes.get(transfer.from_stop_id) ?? INF;
                const transferArrivalTime = fromArrival + transfer.min_transfer_time;
                const hCost = heuristic(transfer.to_stop_id, destinationId);
                const fCost = transferArrivalTime + hCost;

                console.log(`Queuing transfer to stop ${transfer.to_stop_id} (gCost: ${transferArrivalTime}, hCost: ${hCost}, fCost: ${fCost})`);
                openSet.queue({ stopId: transfer.to_stop_id, gCost: transferArrivalTime, fCost, previousStop: transfer.from_stop_id });
            }
        }

        console.log('❌ No route found');
        console.log(`🔎 Total iterations: ${iterationCount}, Skipped stops: ${skippedCount}`);
        return { success: false, message: 'No route found' };

    } catch (error) {
        console.error('🚨 Error in runAstar:', error);
        return { success: false, message: 'Error occurred while finding route', error };
    }
};


// Heuristic function (improved for physical distance if coordinates available)
const heuristic = (currentStopId, destinationId) => {
    // Replace with real-world heuristic using geographical coordinates if possible
    return Math.abs(parseInt(currentStopId, 10) - parseInt(destinationId, 10));
};

// Convert HH:MM:SS format to minutes
const convertTimeToMinutes = (time) => {
    if (!time) {
        console.log("❌ Invalid time format:", time);
        return NaN;
    }
    const timeParts = time.split(':').map(Number);
    if (timeParts.length < 2 || timeParts.length > 3) {
        console.log("⚠️ Error: Time format should be HH:MM or HH:MM:SS.");
        return NaN;
    }

    const [hours, minutes, seconds = 0] = timeParts;
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.log("❌ Error parsing time:", time);
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

module.exports = { runAstar };