var stop_num_list = localStorage.getItem("stop_num_list");
//Comma seperated string of route numbers
var route_list = localStorage.getItem("route_list");

//Array of minutes until next bus for given route
var minutes_list_current = localStorage.getItem("minutes_list_current");
var minutes_list_next = localStorage.getItem("minutes_list_next");
var route_str_list = localStorage.getItem("route_str_list");
var last_route_index = localStorage.getItem("last_route");
var selected_stop_index = localStorage.getItem("selected_stop");
//maintain a seperate list of only the routes valid for the selected stop
var valid_route_list;

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function findClosestStop(stop_numbers) {
	stop_num_list = stop_numbers;
	localStorage.setItem("stop_num_list", stop_num_list);
	console.log("Calling localStorage.setItem: stop num list = " + stop_num_list);

	var stopNumArray = stop_numbers.split(",");

	if (stopNumArray.length === 0) {
		//TODO: send message to display notif that no stop numbers configured
		return;
	} else if (stopNumArray.length === 1) {
		//if there is only one stop number just fetch the times for that stop directly
		setSelectedStopAndFetch(0, route_list);
		//fetchStopTimes(stopNumArray[0], valid_route_list);
		return;
	}

	//otherwise, use current location to find the closest one
	navigator.geolocation.getCurrentPosition(function(position) {
		var currLat = position.coords.latitude;
		var currLong = position.coords.longitude;
		var minDistance;
		var minDistStopIndex;
		var stopRoutes;

		for (var i=0; i<stopNumArray.length; i++) {
			var req = new XMLHttpRequest();
			var requestURL = "http://api.translink.ca/RTTIAPI/V1/stops/" + stopNumArray[i] + "?apiKey=xrt9jWz1VzXJ7unF1tlv"
			console.log("requesting stop information from url: " + requestURL);

			req.open('GET', requestURL, false);
			req.setRequestHeader("Accept", "application/JSON");
			req.send(null);

			if (req.status === 200) {
				console.log("Successfully requested stop information, result: ");
				console.log(req.responseText);
				response = JSON.parse(req.responseText);

				//we need the latitude, longitude, and routes
				var stopLat = response.Latitude;
				var stopLong = response.Longitude;
				//calculate the distance from current location to the configured stop
				var newDist = getDistanceFromLatLonInKm(currLat, currLong, stopLat, stopLong);
				console.log("Stop # " + stopNumArray[i] + " is " + newDist + " km away");
				if (minDistance === undefined || minDistance > newDist) {
					minDistance = newDist;
					minDistStopIndex = i;
					stopRoutes = response.Routes;
				}
			} else {
				console.log("Request for stop " + stopNumArray[i] + " returned error code " + req.status.toString());
			}

		}

		if (minDistStopIndex !== undefined) {
			setSelectedStopAndFetch(minDistStopIndex, stopRoutes);
			//fetchStopTimes(stopNumArray[minDistStopIndex], route_list);
		} else {
			//TODO: send message to display that could not find valid stop number or similar
		}
	});
	
}

function setSelectedStopAndFetch(stop_num_index, available_routes) {
	selected_stop_index = stop_num_index;
	console.log("Calling localStorage.setItem: selected_stop = " + selected_stop_index);
	localStorage.setItem("selected_stop", selected_stop_index);

	var stopNumArray = stop_num_list.split(",");

	console.log("selected stop = " + stopNumArray[selected_stop_index]);
	console.log("available_routes: " + available_routes + " " + typeof available_routes);
	console.log("route_list" + route_list);

	var availableRoutesList = available_routes.split(", ");
	var routeListArray = route_list.split(",");
	//TODO: set valid_route_list based on available routes param
	valid_route_list = [];
	for (var i=0; i<routeListArray.length; i++) {
		var routeNumber = routeListArray[i];
		console.log("routeNumber: " + routeNumber);
		if (availableRoutesList.indexOf(routeNumber) !== -1) {
			console.log("adding " + routeNumber + " to list of valid routes");
			valid_route_list.push(routeNumber);
		}
	}

	console.log("valid_route_list set to: " + valid_route_list);

	fetchStopTimes(stop_num_index, valid_route_list);
}

function fetchStopTimes(stop_num_index, route_numbers) {
	//update local vars and store them
	valid_route_list = route_numbers;
	console.log("setting selected_stop_index = " + stop_num_index);
	selected_stop_index = stop_num_index;

	var route_list_array = valid_route_list;
	var stopNumArray = stop_num_list.split(",");

	var stop_num = stopNumArray[selected_stop_index];

	console.log("fetching stop time for  stop# " + stop_num + " and routes " + valid_route_list.toString());
	
	var minutesList = new Array();
	var nextMinutesList = new Array();
	var routesList = new Array();
	for (var i=0;i<route_list_array.length; i++){
		//Create and dispatch a request for each route
		var req = new XMLHttpRequest();
		var requestURL = "http://api.translink.ca/RTTIAPI/V1/stops/" + stop_num 
			+ "/estimates?timeframe=120&apiKey=xrt9jWz1VzXJ7unF1tlv&routeNo=" + route_list_array[i] + "&count=2";
		console.log("requesting url " + requestURL + " for route %s " + route_list_array[i]);
		req.open('GET', requestURL, false);
		req.setRequestHeader("Accept", "application/JSON");
		req.send(null);
		if (req.status === 200) {
			console.log("Response status OK");
			response = JSON.parse(req.responseText);
			console.log(response.responseText);

			//for now, since we are limiting to a single result, just grab the first one.
			response = response[0];
			if (response.Schedules && i < 10) {
				console.log("Schedules exists");
				if (response.Schedules[0] && response.Schedules[0].ExpectedCountdown) {
					console.log("index 0 exists");
					var minutes = response.Schedules[0].ExpectedCountdown;
					console.log("first minutes = " + minutes);
					minutesList[i] = minutes.toString();
					routesList[i] = "Route " + route_list_array[i].toString();
					console.log("Route " + route_list_array[i] + " arrives in " + minutes.toString());
				}
				if (response.Schedules[1] && response.Schedules[1].ExpectedCountdown) {
					console.log("index 1 exists");
					var nextMinutes = response.Schedules[1].ExpectedCountdown;
					nextMinutesList[i] = nextMinutes.toString();
					//routesList[i] = "Route " + route_list_array[i].toString();
					console.log("Route " + route_list_array[i] + " then arrives in " + nextMinutes.toString());
				}
			} else {
				console.log("Error with Result for route: " + route_list_array[i]);
			}
		} else {
			console.log("Request for route " + route_list_array[i] + " returned error code " + req.status.toString());
		}

	}

	console.log("setting lists: ");
	console.log(routesList.toString());
	console.log(minutesList.toString());
	console.log(nextMinutesList.toString());
	//store the lists of routes and results in local storage as well
	minutes_list_current = minutesList;
	minutes_list_next = nextMinutesList;
	route_str_list = routesList;
	localStorage.setItem("minutes_list_current", minutesList);
	localStorage.setItem("minutes_list_next", nextMinutesList);
	localStorage.setItem("route_str_list", routesList);

	//display the last displayed route initially
	getStopTimeByIndex(last_route_index);
}

function getStopTime(route_number) {
	console.log(routesList.toString());
	var stopNumArray = stop_num_list.split(",");
	var stop_number = stopNumArray[selected_stop_index];

	for (var i=0; i<routesList.length; i++) {
		if (routesList[i] == route_number) {
			Pebble.sendAppMessage({"minutes": minutes_list_current[i] + ", " + minutes_list_next[i] + " min",
									"stop_num": "Stop #" + stop_number,
									"route_num": route_str_list[i]})
		}
	}
}

function getStopTimeByIndex(index) {
	
	console.log("Get stop time by index: " + index);
	if (index == null || route_str_list == null || index == -1 || index >= route_str_list.length){
		index = 0;
	}
	console.log("minutes: " + minutes_list_current[index]);
	console.log("route_num: " + route_str_list[index]);
	var stopNumArray = stop_num_list.split(",");
	var stop_number = stopNumArray[selected_stop_index];

	var minutesString = (minutes_list_current[index] === -1 ? "Now" : minutes_list_current[index]) +
							", " + (minutes_list_next[index] === -1 ? "now" : minutes_list_next[index]) + " min";

	Pebble.sendAppMessage({"minutes": minutesString,
									"stop_num": "Stop #" + stop_number,
									"route_num": route_str_list[index]});

	//store the most recent index
	localStorage.setItem("last_route_index", index);
	last_route_index = index;
}

function refresh() {
if (stop_num_list != null && valid_route_list != null) {
		console.log("refresh -- stop_num_list = " + stop_num_list + ", routeList = " + valid_route_list);
		console.log("selected_stop_index: " + selected_stop_index);
		var stopNumArray = stop_num_list.split(",");
		fetchStopTimes(selected_stop_index, valid_route_list);
	}
}

function reload() {
	if (stop_num_list != null && route_list != null) {
		console.log("reload -- routeList: " + route_list);
		findClosestStop(stop_num_list);
	}
}

function startTimer() {
	setInterval(refresh, 30000);
}

Pebble.addEventListener("ready",
    function(e) {
        console.log("Connected.");
        console.log(stop_num_list);
        console.log(route_list);

        if (stop_num_list !== null && route_list !== null) {
        	//route_list = route_list.split(",");
        	findClosestStop(stop_num_list);
        	console.log("stop times fetched");
        	startTimer();
    	};
    }
);

Pebble.addEventListener("appmessage",
						function(e) {
							console.log("appmessage: " + JSON.stringify(e.payload));

							if (e.payload.action == "nextRoute") {
								console.log(last_route_index);
								if (last_route_index == null || last_route_index < 0) {
									last_route_index == -1;
								}
								getStopTimeByIndex(last_route_index+1);
							} else if (e.payload.action == "refresh") {
								reload();
							}

							
							
						});

Pebble.addEventListener("showConfiguration",
						function(e) {
							console.log("Showing configuration");
							Pebble.openURL('http://jtewfik.github.io/myBus/index.html');
						});

Pebble.addEventListener("webviewclosed",
						function(e) {
							console.log("Closing configuration");
							var test = localStorage.getItem("stop_num_list");
							console.log(test);

							//store the settings
							if (e.response) {
								var config = JSON.parse(e.response);
								console.log("Configuration window returned: " + JSON.stringify(config));

								//set the params and log them
								console.log("Stop Numbers: " + config.stop_num);
								console.log("Route Numbers: " + config.route_num);

								//store the lists and trigger a reload
								localStorage.setItem("route_list", config.route_num);
								localStorage.setItem("stop_num_list", config.stop_num);
								reload();
							} else {
								console.log("no response");
							}

						});
