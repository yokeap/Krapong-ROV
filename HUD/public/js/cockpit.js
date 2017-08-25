/*jshint browser:true */
/*global NodecopterStream:true,
         Compass:true,
         Gauge:true,
         ArtificialHorizon:true,
         requestAnimationFrame:true
*/
(function (window, document) {
    'use strict';
    var NC = function NodecopterCockpit(
        dronestreamDiv, compassDiv, horizonCanvas, gaugeId, gamepadData
    ) {
        var qs           = document.querySelector.bind(document),
            //copterStream = new NodecopterStream(qs(dronestreamDiv)),
            compass      = new Compass(qs(compassDiv)),
            horizon      = new ArtificialHorizon(qs(horizonCanvas)),
            gauge        = new Gauge({
                renderTo    : gaugeId,
                width       : 120,
                height      : 120,
                glow        : true,
                units       : '%',
                title       : 'Battery',
                minValue    : 0,
                maxValue    : 100,
                majorTicks  : [ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                minorTicks  : 2,
                strokeTicks : false,
                highlights  : [
                    { from : 0,   to : 5, color : 'rgba(255, 0, 225, .25)' },
                    { from : 5,   to : 20, color : 'rgba(255, 0, 0, .15)' },
                    { from : 20, to : 50, color : 'rgba(255, 255, 0, .15)' },
                    { from : 50, to : 100, color : 'rgba(0, 255,  255, .25)' },
                ],
                colors      : {
                    plate : '#222',
                    majorTicks : '#f5f5f5',
                    minorTicks : '#ddd',
                    title      : '#fff',
                    units      : '#ccc',
                    numbers    : '#eee',
                    needle     : {
                        start : 'rgba(240, 128, 128, 1)',
                        end : 'rgba(255, 160, 122, .9)'
                    }
                }
            }),
            lastMessage = null,
            
            json = null,

            navdataSocket = new WebSocket(
                'ws://' +
                window.document.location.hostname + ':' +
                window.document.location.port + '/navdata'
            ),

            navDataRenderer = function () {
                if (!lastMessage) {
                    return;
                }
                
                var data = JSON.parse(lastMessage);
                /*console.log(data);
                console.log('roll = ' + data.roll);
                console.log('pith = ' + data.pitch);*/

                horizon.setValues({
                    /*roll : data.demo.rotation.roll * Math.PI / 180,
                    pitch : data.demo.rotation.pitch * Math.PI / 180,*/
                    roll : data.roll * -1 * Math.PI / 180,
                    pitch : data.pitch * Math.PI / 180,
                    //altitude : data.demo.altitudeMeters,
                    //speed : data.demo.velocity.z // no idea...
                });
                horizon.draw();
                //gauge.setValue(data.demo.batteryPercentage);
                //gauge.draw();
                //compass.moveTo(data.demo.rotation.clockwise);
            };
            
            var device_connected = false;
            var count = 0;
            
            var gamepads = new Gamepad();
             var device_index;
             //var device_conneted = false;
             
             if (!gamepads.init()) {
			    alert('Your browser does not support gamepads, get the latest Google Chrome or Firefox.');
		    }
		    
		    gamepads.bind(Gamepad.Event.CONNECTED, function(device) {
    			if((device.id == 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)') && (device_connected == false))
    			{
    			    device_index = device.index;
    			     device_connected = true;
    			    console.log('Connected', device);
    			}
    			//text.html("Gamepad :" + device.id);
    			//text.position(100, 200); 
		    });
		    
		    gamepads.bind(Gamepad.Event.TICK, function(device) {
		        var gamepad = device[device_index];
		        //var gamepad_axes = device[device_index].Axis;
		        //console.log(gamepad.buttons[6].value);
		        
		        
		        
		        json = {
    				surge: parseFloat(gamepad.axes[1]), 
    				sway: parseFloat(gamepad.axes[0]), 
    				yaw: parseFloat(gamepad.buttons[6].value * -1) + parseFloat(gamepad.buttons[7].value), 
    				heave: parseFloat(gamepad.axes[3]),
    				light: parseInt(gamepad.buttons[12].value) + parseInt(gamepad.buttons[13].value * -1),
    				boost: parseFloat(gamepad.buttons[5].value)
			    }
		    });

        navdataSocket.onmessage = function (msg) {
            //console.log(msg.data);
            lastMessage = msg.data;
            requestAnimationFrame(navDataRenderer);
            //console.log(gamepadData);
            
		   count++;
		   //console.log(count);
		   if(count > 5) {
		       count = 0;
		       navdataSocket.send(JSON.stringify(json));
		   }
        };
    };
    window.NodecopterCockpit = NC;
}(window, document));
