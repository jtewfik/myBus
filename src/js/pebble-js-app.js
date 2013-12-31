var stop_num = localStorage.getItem("stop_num");
//Array of route numbers
var route_list = localStorage.getItem("route_list");
//Array of minutes until next bus for given route
var minutes_list = localStorage.getItem("minutes_list");
var route_str_list = localStorage.getItem("route_str_list");
var last_route_index = localStorage.getItem("last_route");

function fetchStopTimes(stop_number, route_numbers) {
	//update local vars and store them
	stop_num = stop_number;
	route_list = route_numbers;
	localStorage.setItem("route_list", route_list);
	localStorage.setItem("stop_num", stop_num);

	console.log("fetching stop time for  stop# " + stop_num + " and routes " + route_list.toString());

	var minutesList = new Array();
	var routesList = new Array();
	for (var i=0;i<route_list.length; i++){
		//Create and dispatch a request for each route
		var req = new XMLHttpRequest();
		req.open('GET', "http://api.translink.ca/RTTIAPI/V1/stops/" + stop_num + "/estimates?timeframe=120&apiKey=xrt9jWz1VzXJ7unF1tlv&routeNo=" + route_num + "&count=1", false);
		req.setRequestHeader("Accept", "application/JSON");
		req.send(null);
		if (req.status == 200) {
			console.log("Response status OK");
			response = JSON.parse(req.responseText);

			//for now, since we are limiting to a single result, just grab the first one.
			response = response[0];
			if (response.Schedules && response.Schedules[0].ExpectedCountdown && i < 10) {
				var minutes = response.Schedules[0].ExpectedCountdown;
				minutesList[i] = minutes.toString() + " minutes away";
				routesList[i] = "Route " + route_list[i].toString();
				console.log("Route " + route_list[i] + " arrives in " + minutes.toString);
			} else {
				console.log("Error with Result for route: " + route_list[i]);
			}
		} else {
			console.log("Request for route " + route_list[i] + " returned error code " + req.status.toString());
		}

	}

	console.log("setting lists");
	console.log(routesList.toString());
	console.log(minutesList.toString());
	//store the lists of routes and results in local storage as well
	minutes_list = minutesList;
	route_str_list = routesList;
	localStorage.setItem("minutes_list", minutesList);
	localStorage.setItem("route_str_list", routesList);

	//display the last displayed route initially
	getStopTimeByIndex(last_route_index);
}

function getStopTime(route_number) {
	// var routesList = localStorage.getItem("route_list");
	// var routeStrList = localStorage.getItem("route_str_list");
	// var minutesList=  localStorage.getItem("minutes_list");
	console.log(routesList.toString());
	for (var i=0; i<routesList.length; i++) {
		if (routesList[i] == route_number) {
			Pebble.sendAppMessage({"minutes": minutesList[i],
									"stop_num": "Stop #" + stop_num.toString(),
									"route_num": routesStrList[i]})
		}
	}
}

function getStopTimeByIndex(index) {
	// var routesList = localStorage.getItem("route_list");
	// var routeStrList = localStorage.getItem("route_str_list");
	// var minutesList=  localStorage.getItem("minutes_list");
	Pebble.sendAppMessage({"minutes": minutes_list[index],
									"stop_num": "Stop #" + stop_num.toString(),
									"route_num": routes_str_list[index]});
}

Pebble.addEventListener("ready",
    function(e) {
        console.log("Connected.");
        console.log(stop_num);
        console.log(route_list);

        if (stop_num != null && route_list != null) {
        	var splitList = route_list.split(",");
        	fetchStopTimes(stop_num, splitList);
        	console.log("stop times fetched");
    	};
    }
);

Pebble.addEventListener("appmessage",
						function(e) {
							console.log("appmessage");
							getStopTimeByIndex(last_route_index+1);
							
						});

Pebble.addEventListener("showConfiguration",
						function(e) {
							console.log("Showing configuration");
							Pebble.openURL('http://jtewfik.github.io/myBus/index.html');
						});

Pebble.addEventListener("webviewclosed",
						function(e) {
							console.log("Closing configuration");
							var test = localStorage.getItem("stop_num");
							console.log(test);

							//store the settings
							if (e.response) {
								var config = JSON.parse(e.response);
								console.log("Configuration window returned: " + JSON.stringify(config));

								//set the params and log them
								console.log("Stop Number: " + config.stop_num);
								console.log("Route Numbers: " + config.route_num);

								var routeList = config.route_num.split(",");

								fetchStopTimes(config.stop_num, routeList);
							} else {
								console.log("no response");
							}

						});
