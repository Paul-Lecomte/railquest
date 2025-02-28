const Stop = require('../models/stopsModel');
const Route = require('../models/routesModel');
const Trip = require('../models/tripsModel');
const StopTime = require('../models/stopTimesModel');
const Transfer = require('../models/transfersModel');

const runRaptor = async (originId, destinationId, departureTime) => {
    try {
        console.log(`Origin ID: ${originId}, Destination ID: ${destinationId}`);
        const stops = await Stop.find({});
        const stopIndexMap = new Map(stops.map((stop, index) => [stop.stop_id, index]));
        const INF = Number.MAX_SAFE_INTEGER;

        console.log(`Departure time received: ${departureTime}`);
        const departureTimeInMinutes = convertTimeToMinutes(departureTime);
        console.log(`Departure time in minutes: ${departureTimeInMinutes}`);

        let arrivalTimes = new Map();
        let previousStops = new Map();
        let missingTripOrRoute = new Set(); // Track which stops have missing trip_id or route_id

        arrivalTimes.set(originId, departureTimeInMinutes);
        previousStops.set(originId, null); // Set the origin's previous stop as null
        let markedStops = new Set([originId]);
        let skippedCount = 0;

        let round = 0;
        while (markedStops.size > 0) {
            console.log(`Round ${round + 1}: Processing marked stops...`);
            let newMarkedStops = new Set();

            // Process marked stops
            for (let stop of markedStops) {
                if (!arrivalTimes.has(stop)) {
                    // Update arrival time for transfers
                    console.log(`Updating arrival time for transfer to stop ${stop}`);
                    arrivalTimes.set(stop, departureTimeInMinutes); // Use the current departure time for first time
                    previousStops.set(stop, originId); // Store the previous stop for path reconstruction
                }
            }

            console.log('Previous stops after round ' + round + ':', Array.from(previousStops.entries()));

            const stopTimePromises = Array.from(markedStops).map(stopId =>
                StopTime.find({ stop_id: stopId }).populate({
                    path: 'trip_id',
                    populate: { path: 'route_id' }
                })
            );

            const stopTimesArray = await Promise.all(stopTimePromises);

            // Process stop times
            for (const stopTimes of stopTimesArray) {
                for (const stopTime of stopTimes) {
                    const trip = stopTime.trip_id;
                    const route = trip?.route_id;
                    const stopId = stopTime.stop_id;

                    // Check if trip_id and route_id are valid
                    if (!trip || !route) {
                        skippedCount++;
                        if (!missingTripOrRoute.has(stopId)) {
                            console.log(`Skipping stopTime due to missing trip_id or route_id for stop ${stopId}`);
                            missingTripOrRoute.add(stopId);
                        }
                        continue;
                    }

                    // Check if stop_id exists in the Stops collection
                    const stopExists = await Stop.exists({ stop_id: stopId });
                    if (!stopExists) {
                        console.log(`Skipping stopTime due to invalid stop_id ${stopId}`);
                        continue;
                    }

                    const arrivalTimeInMinutes = convertTimeToMinutes(stopTime.arrival_time);
                    const currentArrival = arrivalTimes.get(stopId) ?? INF;

                    if (arrivalTimeInMinutes < currentArrival) {
                        console.log(`Updating arrival time for stop ${stopId} to ${arrivalTimeInMinutes}`);
                        arrivalTimes.set(stopId, arrivalTimeInMinutes);
                        previousStops.set(stopId, stopId); // Adjusted: Set the previous stop as the current stop
                        newMarkedStops.add(stopId);

                        if (stopId === destinationId) {
                            console.log(`Destination ${destinationId} reached at ${convertMinutesToTime(arrivalTimeInMinutes)} in round ${round + 1}`);
                        }
                    }
                }
            }

            const transferPromises = Array.from(markedStops).map(stopId =>
                Transfer.find({ from_stop_id: stopId })
            );
            const transfersArray = await Promise.all(transferPromises);

            for (const transfers of transfersArray) {
                for (const transfer of transfers) {
                    const fromArrival = arrivalTimes.get(transfer.from_stop_id) ?? INF;
                    const transferArrivalTime = fromArrival + transfer.min_transfer_time;
                    const currentArrival = arrivalTimes.get(transfer.to_stop_id) ?? INF;

                    if (transferArrivalTime < currentArrival) {
                        console.log(`Updating arrival time for transfer to stop ${transfer.to_stop_id}`);
                        arrivalTimes.set(transfer.to_stop_id, transferArrivalTime);
                        previousStops.set(transfer.to_stop_id, transfer.from_stop_id);
                        newMarkedStops.add(transfer.to_stop_id);

                        if (transfer.to_stop_id === destinationId) {
                            console.log(`Transfer leads directly to destination at round ${round + 1}`);
                        }
                    }
                }
            }

            if (newMarkedStops.size === 0) break;
            markedStops = newMarkedStops;
            round++;
        }

        let bestTime = INF;
        let bestRound = -1;
        for (const [round, arrivalTime] of arrivalTimes.entries()) {
            if (arrivalTime < bestTime) {
                bestTime = arrivalTime;
                bestRound = round;
            }
        }

        if (bestTime === INF) {
            console.log('No route found');
            return { success: false, message: 'No route found' };
        }

        const path = [];
        let currentStop = destinationId;
        console.log('Reconstructing path...');
        while (currentStop) {
            path.unshift(currentStop); // Add the current stop to the front of the path
            console.log(`Reconstructed stop: ${currentStop}`);
            currentStop = previousStops.get(currentStop);

            if (!currentStop) {
                console.log('No previous stop found for:', currentStop);
                break; // Handle missing data more gracefully
            }
        }

        console.log('Full reconstructed path:', path);

        console.log(`Skipped ${skippedCount} stopTimes with missing trip or route_id.`);
        if (skippedCount > 0) {
            console.log('Check the stops with missing trip_id or route_id in your database.');
        }

        console.log('Route found successfully');
        return {
            success: true,
            message: 'Fastest route found!',
            route: path,
            departureTime,
            arrivalTime: convertMinutesToTime(bestTime)
        };
    } catch (error) {
        console.error('Error in runRaptor:', error);
        return { success: false, message: 'Error occurred while finding route', error };
    }
};


// Utility function to convert time in HH:MM or HH:MM:SS format to minutes
const convertTimeToMinutes = (time) => {
    if (!time) {
        console.log("Invalid time format:", time);
        return NaN;
    }
    const timeParts = time.split(':').map(Number);
    if (timeParts.length < 2 || timeParts.length > 3) {
        console.log("Error: Time format should be HH:MM or HH:MM:SS.");
        return NaN;
    }

    const [hours, minutes, seconds = 0] = timeParts;
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.log("Error parsing time:", time);
        return NaN;
    }

    return hours * 60 + minutes + (seconds / 60);
};

// Utility function to convert time in minutes to HH:MM:SS format
const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.round((minutes % 1) * 60);
    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

module.exports = { runRaptor };