var stop_num = localStorage.getItem("stop_num");
var route_nums = localStorage.getItem("route_nums");

function fetchStopTime(stop_number, route_numbers) {
	//update local vars
	stop_num = stop_number;
	route_nums = route_numbers;

	console.log("fetching stop time for  stop# " + stop_num + " and routes " + route_nums.toString();

	var minutesList = new Array();
	var routesList = new Array();
	for (var i=0;i<route_nums.length; i++){
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
				routesList[i] = "Route " + route_nums[i].toString();
				console.log("Route " + route_nums[i] + " arrives in " + minutes.toString);
			} else {
				console.log("Error with Result for route: " + route_nums[i]);
			}
		} else {
			console.log("Request for route " + route_nums[i] + " returned error code " + req.status.toString());
		}
	}

	Pebble.sendAppMessage({
					"minutes": minutesList,
					"stop_num": "Stop #" + stop_num.toString(),
					"route_nums": routesList
				});


	var req = new XMLHttpRequest();

	var response;
	var req = new XMLHttpRequest();
	req.open('GET', "http://api.translink.ca/RTTIAPI/V1/stops/" + stop_num + "/estimates?timeframe=120&apiKey=xrt9jWz1VzXJ7unF1tlv&routeNo=" + route_num + "&count=1", false);
	req.setRequestHeader("Accept", "application/JSON");
	req.onload = function(e) {
		if (req.status == 200) {
			console.log(req.responseText);
			response = JSON.parse(req.responseText);

			var minutes;
			//TODO: handle multiple stops?
			response = response[0];
			if (response.Schedules && response.Schedules[0].ExpectedCountdown) {
				minutes = response.Schedules[0].ExpectedCountdown;
				console.log(minutes.toString());
				Pebble.sendAppMessage({
					"minutes": minutes.toString() + " minutes away",
					"stop_num": "Stop #" + stop_num.toString(),
					"route_nums": "Route " + route_num.toString()
				});
			} else {

				console.log("error");
				Pebble.sendAppMessage({"minutes":"Error"});
			}
		} else {
			console.log("Request returned error code " + req.status.toString());
		}
	}
	req.send(null);
}

Pebble.addEventListener("ready",
    function(e) {
        console.log("Connected.");
        if (stop_num != null && route_num != null) {
        	fetchStopTime(stop_num, route_num);
    	};
    }
);

Pebble.addEventListener("appmessage",
						function(e) {
							console.log("appmessage");

							fetchStopTime(stop_num, route_num);
							
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
								console.log("Route Numbers: " + config.route_nums);

								localStorage.setItem("stop_num", config.stop_num);
								var routeList = config.route_nums.split(",");
								localStorage.setItem("route_nums", routeList);
								if (routeList.length >= 0) {
									localStorage.setItem("route_num", config.route_num);
								}

								fetchStopTime(config.stop_num, config.route_num);
							} else {
								console.log("no response");
							}

						});
