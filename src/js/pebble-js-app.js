var stop_num = 50182;
var route_num = 003;

function fetchStopTime(stop_num_param, route_num_param) {
	//update local vars
	stop_num = stop_num_param;
	route_num = route_num_param;

	console.log("fetching stop time for  stop# " + stop_num + " and route " + route_num);

	var response;
	var req = new XMLHttpRequest();
	req.open('GET', "http://api.translink.ca/RTTIAPI/V1/stops/" + stop_num + "/estimates?timeframe=120&apiKey=xrt9jWz1VzXJ7unF1tlv&routeNo=" + route_num + "&count=1", true);
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
					"route_num": "Route " + route_num.toString()
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
        fetchStopTime(stop_num, route_num);
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
							//store the settings
							if (e.response) {
								var config = JSON.parse(e.response);
								console.log("Configuration window returned: " + JSON.stringify(config));

								//set the params and log them
								console.log("Stop Number: " + config.stop_num);
								console.log("Route Number: " + config.route_num);
								localStorage.setItem("stop_num", config.stop_num);
								localStorage.setItem("route_num", config.route_num);

								fetchStopTime(config.stop_num, config.route_num);
							}

						});
