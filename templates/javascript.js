<script>

var nopidrefresh = "0";

$(function() {
	
	interval = window.setInterval(function(){ servicestatus(); }, 3000);
	servicestatus();
	getconfig();
	update_ver();

});

// SERVICE STATE

function servicestatus() {

	if (nopidrefresh === "1") {
		return;
	}

	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'servicestatus'
			}
		} )
	.fail(function( data ) {
		console.log( "Servicestatus Fail", data );
		$("#servicestatus").attr("style", "background:#dfdfdf; color:red").html("<TMPL_VAR "COMMON.HINT_FAILED">");
		$("#servicestatusicon").html("<img src='./images/unknown_20.png'>");
	})
	.done(function( data ) {
		console.log( "Servicestatus Success", data );
		if (data.pid) {
			$("#servicestatus").attr("style", "background:#6dac20; color:black").html("<TMPL_VAR "COMMON.HINT_RUNNING"> <span class='small'>PID: " + data.pid + "</span>");
			$("#servicestatusicon").html("<img src='./images/check_20.png'>");
		} else {
			$("#servicestatus").attr("style", "background:#FF6339; color:black").html("<TMPL_VAR "COMMON.HINT_STOPPED">");
			$("#servicestatusicon").html("<img src='./images/error_20.png'>");
		}
	})
	.always(function( data ) {
		console.log( "Servicestatus Finished", data );
	});
}

// SERVICE START_STOP

function servicerestart() {

	nopidrefresh = "1";
	$("#servicestatus").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_EXECUTING">");
	$("#servicestatusicon").html("<img src='./images/unknown_20.png'>");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'servicerestart'
			}
		} )
	.fail(function( data ) {
		console.log( "Servicerestart Fail", data );
	})
	.done(function( data ) {
		console.log( "Servicerestart Success", data );
		if (data == "0") {
			servicestatus();
		} else {
			$("#servicestatus").attr("style", "background:#dfdfdf; color:red").html("<TMPL_VAR "COMMON.HINT_FAILED">");
		}
	})
	.always(function( data ) {
		console.log( "Servicerestart Finished", data );
		nopidrefresh = "0";
	});
}

function servicestop() {

	nopidrefresh = "1";
	$("#servicestatus").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_EXECUTING">");
	$("#servicestatusicon").html("<img src='./images/unknown_20.png'>");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'servicestop'
			}
		} )
	.fail(function( data ) {
		console.log( "Servicestop Fail", data );
	})
	.done(function( data ) {
		console.log( "Servicestop Success", data );
		if (data == "0") {
			servicestatus();
		} else {
			$("#servicestatus").attr("style", "background:#dfdfdf; color:red").html("<TMPL_VAR "COMMON.HINT_FAILED">");
		}
	})
	.always(function( data ) {
		console.log( "Servicestop Finished", data );
		nopidrefresh = "0";
	});
}

// ADD GPIO MODULE: Popup

function popup_add_gpiomodule() {

	var module = $('#gpio_module').val();
	// Clean Popup
	$("#savinghint_" + module).html('&nbsp;');
	$("#edit_" + module).val('');
	$( "#form_" + module )[0].reset();
	// Open Popup
	$( "#popup_gpio_module_" + module ).popup( "open" );

}

// EDIT GPIO MODULE: Popup

function popup_edit_gpiomodule(modulename) {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "edit_gpiomodule Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "edit_gpiomodule Success", data );

		modules = data.gpio_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			return;
		}
		$.each( modules, function( intDevId, item){
			if (item.name == modulename) {
				$("#name_" + item.module).val(item.name);
                                $("#module_" + item.module).val(item.module);
				$("#i2c_bus_num_" + item.module).val(item.i2c_bus_num).selectmenu('refresh',true);
				$("#chip_addr_" + item.module).val(item.chip_addr).selectmenu('refresh',true);
                                $("#edit_" + item.module).val(item.name);
				$("#popup_gpio_module_" + item.module ).popup( "open" );
			}
		});
	})
	.always(function( data ) {
		console.log( "edit_gpiomodule Finished" );
	})

}

// ADD/EDIT GPIO MODULE (save to config)

function add_gpiomodule(module) {

	$("#savinghint_" + module).attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_SAVING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'gpiomodule',
				name: $("#name_" + module).val(),
				module: $("#module_" + module).val(),
				i2c_bus_num: $("#i2c_bus_num_" + module).val(),
				chip_addr: $("#chip_addr_" + module).val(),
				edit: $("#edit_" + module).val(),
			}
		} )
	.fail(function( data ) {
		console.log( "add_gpiomodule Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#savinghint_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "add_gpiomodule Done", data );
		if (data.error) {
			$("#savinghint_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#savinghint_" + module).attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_gpio_module_" + module).popup( "close" );
			$( "#form_" + module )[0].reset();
			$("#savinghint_" + module).html('&nbsp;');
		}
	})
	.always(function( data ) {
		console.log( "add_gpiomodule Finished", data );
	});

}

// DELETE GPIO MODULE: Popup

function popup_delete_gpiomodule(modulename) {

	$("#deletegpiomodulehint").html('&nbsp;');
	$("#deletemodulename").html(modulename);
	$("#popup_delete_gpio_module").popup( "open" )

}

// DELETE GPIO MODULE (save to config)

function delete_gpiomodule() {

	$("#deletegpiomodulehint").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_DELETING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'deletegpiomodule',
				name: $("#deletemodulename").html(),
			}
		} )
	.fail(function( data ) {
		console.log( "delete_gpiomodule Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#deletegpiomodulehint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "delete_gpiomodule Done", data );
		if (data.error) {
			$("#deletegpiomodulehint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#deletegpiomodulehint").attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_delete_gpio_module").popup( "close" );
			$("#deletegpiomodulehint").html("&nbsp;");
		}
	})
	.always(function( data ) {
		console.log( "add_gpiomodule Finished", data );
	});

}

// ADD DIGITAL OUTPUT: Popup

function popup_add_digitaloutput() {

	var array = $('#digitaloutput_module').val().split(',');
	var modulename = array[0];
	var module = array[1];

	// Set defaults
	$("#form_digitaloutput_" + module)[0].reset();
	$("#edit_digitaloutput_" + module).val('');
	$("#savinghint_digitaloutput_" + module).html('&nbsp;');
	$('#gpiomodule_digitaloutput_' + module).val(modulename);
	// Open Popup
	$( "#popup_digitaloutput_" + module ).popup( "open" )

}

// EDIT DIGITAL OUTPUT: Popup

function popup_edit_digitaloutput(digitaloutputname) {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "edit_digitaloutput Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "edit_digitaloutput Success", data );

		outputs = data.digital_outputs;
		if ( data.error || jQuery.isEmptyObject(outputs)) {
			outputs = undefined;
			return;
		}
		modules = data.gpio_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			return;
		}
		$.each( outputs, function( intDevId, item){
			if (item.name == digitaloutputname) {
				var module;
				$.each( modules, function( intDevIdimod, itemmod){
					if (itemmod.name == item.module) {
						module = itemmod.module;
					}
				});
				if ( module === undefined ) {
					return;
				}
				$("#name_digitaloutput_" + module).val(item.name);
				$("#gpiomodule_digitaloutput_" + module).val(item.module);
				$("#pin_digitaloutput_" + module).val(item.pin).selectmenu('refresh',true);
				$("#on_payload_digitaloutput_" + module).val(item.on_payload);
				$("#off_payload_digitaloutput_" + module).val(item.off_payload);
				if ( item.inverted == "true" ) {
					$("#inverted_digitaloutput_" + module).prop('checked', true).checkboxradio('refresh');
				} else {
					$("#inverted_digitaloutput_" + module).prop('checked', false).checkboxradio('refresh');
				}
				$("#initial_digitaloutput_" + module).val(item.initial).selectmenu('refresh',true);
				$("#timed_ms_digitaloutput_" + module).val(item.timed_set_ms);
				$("#edit_digitaloutput_" + module).val(item.name);
				// Open Popup
				$("#savinghint_digitaloutput_" + module).html('&nbsp;');
				$("#popup_digitaloutput_" + module ).popup( "open" );
			}
		});
	})
	.always(function( data ) {
		console.log( "edit_digitaloutput Finished" );
	})

}

// ADD/EDIT DIGITAL OUTPUT (save to config)

function add_digitaloutput(module) {

	//var checkboxvalues = [];
	//jQuery("input[name='checkbox']").each(function() {
	//checkboxvalues.push($(this).val());
	//});
	//test: countries.join(", "),

	$("#savinghint_digitaloutput_" + module).attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_SAVING">");
	if ( $("#inverted_digitaloutput_" + module).is(":checked") ) {
		invertedchecked = "true";
	} else {
		invertedchecked = "false";
	}
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'digitaloutput',
				name: $("#name_digitaloutput_" + module).val(),
				module: $("#gpiomodule_digitaloutput_" + module).val(),
				pin: $("#pin_digitaloutput_" + module).val(),
				payload_on: $("#on_payload_digitaloutput_" + module).val(),
				payload_off: $("#off_payload_digitaloutput_" + module).val(),
				inverted: invertedchecked,
				initial: $("#initial_digitaloutput_" + module).val(),
				timed_ms: $("#timed_ms_digitaloutput_" + module).val(),
				edit: $("#edit_digitaloutput_" + module).val(),
			}
		} )
	.fail(function( data ) {
		console.log( "add_digitaloutput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#savinghint_digitaloutput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "add_digitaloutput Done", data );
		if (data.error) {
			$("#savinghint_digitaloutput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#savinghint_digitaloutput_" + module).attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_digitaloutput_" + module).popup( "close" );
			// Clean Popup
			$( "#form_digitaloutput_" + module )[0].reset();
			$("#savinghint_digitaloutput_" + module).html('&nbsp;');
		}
	})
	.always(function( data ) {
		console.log( "add_digitaloutput Finished", data );
	});

}

// DELETE DIGITALOUTPUT: Popup

function popup_delete_digitaloutput(outputname) {

	$("#deletedigitaloutputhint").html('&nbsp;');
	$("#deletedigitaloutputname").html(outputname);
	$( "#popup_delete_digital_output" ).popup( "open" )

}

// DELETE DIGITALOUTPUT (save to config)

function delete_digitaloutput() {

	$("#deletedigitaloutputhint").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_DELETING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'deletedigitaloutput',
				name: $("#deletedigitaloutputname").html(),
			}
		} )
	.fail(function( data ) {
		console.log( "delete_digitaloutput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#deletedigitaloutputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "delete_digitaloutput Done", data );
		if (data.error) {
			$("#deletedigitaloutputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#deletedigitaloutputhint").attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_delete_digital_output").popup( "close" );
			$("#deletedigitaloutputhint").html("&nbsp;");
		}
	})
	.always(function( data ) {
		console.log( "add_digitaloutput Finished", data );
	});

}

// ADD DIGITAL INPUT: Popup

function popup_add_digitalinput() {

	var array = $('#digitalinput_module').val().split(',');
	var modulename = array[0];
	var module = array[1];

	// Set defaults
	$("#form_digitalinput_" + module)[0].reset();
	$("#edit_digitalinput_" + module).val('');
	$("#savinghint_digitalinput_" + module).html('&nbsp;');
	$('#gpiomodule_digitalinput_' + module).val(modulename);	
	
	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "popup_add_digitalinput Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "popup_add_digitalinput Success", data );
		modules = data.gpio_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			$("#moduleslist_digitalinput_" + module).html('<TMPL_VAR "INPUTS.HINT_NO_MODULES">');
		} else {
			var select = $("<select id='interruptfor_digitalinput_" + module + "' name='interruptfor_digitalinput_" + module + "' data-mini='true'>");
			select.append($("<option value='none'><TMPL_VAR 'COMMON.LABEL_NONE'></option>"));
			$.each( modules, function( intDevId, item){
				if (item.module == module) {
					return;
				}
				select.append($("<option value='" + item.name + "'>" + item.name + "</option>"));
			});
			$('#moduleslist_digitalinput_' + module).html(select);
			$('#interruptfor_digitalinput_' + module).selectmenu();
			$('#interruptfor_digitalinput_' + module).selectmenu("refresh", true);
		};
	})
	.always(function( data ) {
		console.log( "popup_add_digitaloutput Finished", data );
	});
	// Open Popup
	$( "#popup_digitalinput_" + module ).popup( "open" )

}

// EDIT DIGITAL INPUT: Popup

function popup_edit_digitalinput(digitalinputname) {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "edit_digitalinput Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "edit_digitalinput Success", data );
		inputs = data.digital_inputs;
		if ( data.error || jQuery.isEmptyObject(inputs)) {
			outputs = undefined;
			return;
		}
		modules = data.gpio_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			return;
		}
		$.each( inputs, function( intDevId, item){
			if (item.name == digitalinputname) {
				var module;
				$.each( modules, function( intDevIdimod, itemmod){
					if (itemmod.name == item.module) {
						module = itemmod.module;
					}
				});
				if ( module === undefined ) {
					return;
				}
				$("#name_digitalinput_" + module).val(item.name);
				$("#gpiomodule_digitalinput_" + module).val(item.module);
				$("#pin_digitalinput_" + module).val(item.pin).selectmenu('refresh',true);
				$("#payload_on_digitalinput_" + module).val(item.on_payload);
				$("#payload_off_digitalinput_" + module).val(item.off_payload);
				if ( item.inverted == "true" ) {
					$("#inverted_digitalinput_" + module).prop('checked', true).checkboxradio('refresh');
				} else {
					$("#inverted_digitalinput_" + module).prop('checked', false).checkboxradio('refresh');
				}
				if ( item.pullup == "true" ) {
					$("#resistor_digitalinput_" + module).val('pullup').selectmenu('refresh',true);
				} else if ( item.pulldown == "true" ) {
					$("#resistor_digitalinput_" + module).val('pulldown').selectmenu('refresh',true);
				} else {
					$("#resistor_digitalinput_" + module).val('none').selectmenu('refresh',true);
				}
				if ( item.interrupt ) {
					$("#interrupt_digitalinput_" + module).val(item.interrupt).selectmenu('refresh',true);
				} else {
					$("#interrupt_digitalinput_" + module).val("none").selectmenu('refresh',true);
				}
				$("#pollinterval_digitalinput_" + module).val(item.poll_interval);
				$("#bouncetime_digitalinput_" + module).val(item.bouncetime);
				$("#edit_digitalinput_" + module).val(item.name);
				var select = $("<select id='interruptfor_digitalinput_" + module + "' name='interruptfor_digitalinput_" + module + "' data-mini='true'>");
				select.append($("<option value='none'><TMPL_VAR 'COMMON.LABEL_NONE'></option>"));
				$.each( modules, function( intDevId, item){
					if (item.module == module) {
						return;
					}
					select.append($("<option value='" + item.name + "'>" + item.name + "</option>"));
				});
				$('#moduleslist_digitalinput_' + module).html(select);
				$('#interruptfor_digitalinput_' + module).selectmenu();
				if ( item.interrupt_for ) {
					var moduleint;
					firstinput = item.interrupt_for[0];
					$.each( inputs, function( intDevId, itemint){
						if ( itemint.name == firstinput ) {
							moduleint = itemint.module;
							return;
						}
					});
				}
				if ( moduleint ) {
					$('#interruptfor_digitalinput_' + module).val(moduleint).selectmenu("refresh", true);
				} else {
					$('#interruptfor_digitalinput_' + module).val("none").selectmenu("refresh", true);
				}
				// Open Popup
				$("#savinghint_digitalinput_" + module).html('&nbsp;');
				$("#popup_digitalinput_" + module ).popup( "open" );
			}
		});
	})
	.always(function( data ) {
		console.log( "edit_digitalinput Finished" );
	})

}

// ADD/EDIT DIGITAL INPUT (save to config)

function add_digitalinput(module) {

	//var checkboxvalues = [];
	//jQuery("input[name='checkbox']").each(function() {
	//checkboxvalues.push($(this).val());
	//});
	//test: countries.join(", "),

	$("#savinghint_digitalinput_" + module).attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_SAVING">");
	if ( $("#inverted_digitalinput_" + module).is(":checked") ) {
		invertedchecked = "true";
	} else {
		invertedchecked = "false";
	}
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'digitalinput',
				name: $("#name_digitalinput_" + module).val(),
				module: $("#gpiomodule_digitalinput_" + module).val(),
				pin: $("#pin_digitalinput_" + module).val(),
				payload_on: $("#payload_on_digitalinput_" + module).val(),
				payload_off: $("#payload_off_digitalinput_" + module).val(),
				inverted: invertedchecked,
				resistor: $("#resistor_digitalinput_" + module).val(),
				bouncetime: $("#bouncetime_digitalinput_" + module).val(),
				pollinterval: $("#pollinterval_digitalinput_" + module).val(),
				interrupt: $("#interrupt_digitalinput_" + module).val(),
				interruptfor: $("#interruptfor_digitalinput_" + module).val(),
				edit: $("#edit_digitalinput_" + module).val(),
			}
		} )
	.fail(function( data ) {
		console.log( "add_digitalinput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#savinghint_digitalinput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "add_digitalinput Done", data );
		if (data.error) {
			$("#savinghint_digitalinput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#savinghint_digitalinput_" + module).attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_digitalinput_" + module).popup( "close" );
			// Clean Popup
			$( "#form_digitalinput_" + module )[0].reset();
			$("#savinghint_digitalinput_" + module).html('&nbsp;');
		}
	})
	.always(function( data ) {
		console.log( "add_digitalinput Finished", data );
	});

}

// DELETE DIGITALINPUT: Popup

function popup_delete_digitalinput(inputname) {

	$("#deletedigitalinputhint").html('&nbsp;');
	$("#deletedigitalinputname").html(inputname);
	$( "#popup_delete_digital_input" ).popup( "open" )

}

// DELETE DIGITALINPUT (save to config)

function delete_digitalinput() {

	$("#deletedigitalinputhint").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_DELETING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'deletedigitalinput',
				name: $("#deletedigitalinputname").html(),
			}
		} )
	.fail(function( data ) {
		console.log( "delete_digitalinput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#deletedigitalinputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "delete_digitalinput Done", data );
		if (data.error) {
			$("#deletedigitalinputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#deletedigitalinputhint").attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_delete_digital_input").popup( "close" );
			$("#deletedigitalinputhint").html("&nbsp;");
		}
	})
	.always(function( data ) {
		console.log( "add_digitalinput Finished", data );
	});

}

// ADD SENSOR MODULE: Popup

function popup_add_sensormodule() {

	var module = $('#sensor_module').val();
	// Clean Popup
	$("#savinghint_" + module).html('&nbsp;');
	$("#edit_" + module).val('');
	$( "#form_" + module )[0].reset();
	// Open Popup
	$( "#popup_sensor_module_" + module ).popup( "open" );

}

// EDIT SENSOR MODULE: Popup

function popup_edit_sensormodule(modulename) {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "edit_sensormodule Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "edit_sensormodule Success", data );

		modules = data.sensor_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			return;
		}
		$.each( modules, function( intDevId, item){
			if (item.name == modulename) {
				$("#name_" + item.module).val(item.name);
				$("#module_" + item.module).val(item.module);
				$("#shunt_ohms_" + item.module).val(item.shunt_ohms);
				$("#max_amps_" + item.module).val(item.max_amps);
				$("#pin_" + item.module).val(item.pin).selectmenu('refresh',true);
				$("#type_" + item.module).val(item.type).selectmenu('refresh',true);
				$("#gain_" + item.module).val(item.gain).selectmenu('refresh',true);
				if (item.output_g) { $("#output_g_" + item.module).val(item.output_g).selectmenu('refresh',true) };
				$("#voltage_range_" + item.module).val(item.voltage_range).selectmenu('refresh',true);
				$("#chip_addr_" + item.module).val(item.chip_addr).selectmenu('refresh',true);
				$("#i2c_bus_num_" + item.module).val(item.i2c_bus_num).selectmenu('refresh',true);
				if (item.low_power) { $("#low_power_" + item.module ).prop("checked", true).checkboxradio("refresh") };
				if (item.pins) {
					if (item.pins.includes(0)) { $("#pin0_" + item.module ).prop("checked", true).checkboxradio("refresh") };
					if (item.pins.includes(1)) { $("#pin1_" + item.module ).prop("checked", true).checkboxradio("refresh") };
					if (item.pins.includes(2)) { $("#pin2_" + item.module ).prop("checked", true).checkboxradio("refresh") };
					if (item.pins.includes(3)) { $("#pin3_" + item.module ).prop("checked", true).checkboxradio("refresh") };
				}
				$("#edit_" + item.module).val(item.name);
				$("#popup_sensor_module_" + item.module ).popup( "open" );
			}
		});
	})
	.always(function( data ) {
		console.log( "edit_sensormodule Finished" );
	})

}

// ADD/EDIT SENSOR MODULE (save to config)

function add_sensormodule(module) {

	$("#savinghint_" + module).attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_SAVING">");
	$.ajax( {
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'sensormodule',
				name: $("#name_" + module).val(),
				module: $("#module_" + module).val(),
				type: $("#type_" + module).val(),
				gain: $("#gain_" + module).val(),
				shunt_ohms: $("#shunt_ohms_" + module).val(),
				max_amps: $("#max_amps_" + module).val(),
				output_g: $("#output_g_" + module).val(),
				voltage_range: $("#voltage_range_" + module).val(),
				low_power: $("#low_power_" + module).is(":checked"),
				chip_addr: $("#chip_addr_" + module).val(),
				i2c_bus_num: $("#i2c_bus_num_" + module).val(),
				pin: $("#pin_" + module).val(),
				pin0: $("#pin0_" + module).is(":checked"),
				pin1: $("#pin1_" + module).is(":checked"),
				pin2: $("#pin2_" + module).is(":checked"),
				pin3: $("#pin3_" + module).is(":checked"),
				edit: $("#edit_" + module).val(),
			}
		} )
	.fail(function( data ) {
		console.log( "add_sensormodule Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#savinghint_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "add_sensormodule Done", data );
		if (data.error) {
			$("#savinghint_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#savinghint_" + module).attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_sensor_module_" + module).popup( "close" );
			$("#form_" + module )[0].reset();
			$("#savinghint_" + module).html('&nbsp;');
		}
	})
	.always(function( data ) {
		console.log( "add_sensormodule Finished", data );
	});

}

// DELETE SENSOR MODULE: Popup

function popup_delete_sensormodule(modulename) {

	$("#deletesensormodulehint").html('&nbsp;');
	$("#deletemodulename").html(modulename);
	$("#popup_delete_sensor_module").popup( "open" )

}

// DELETE SENSOR MODULE (save to config)

function delete_sensormodule() {

	$("#deletesensormodulehint").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_DELETING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'deletesensormodule',
				name: $("#deletemodulename").html(),
			}
		} )
	.fail(function( data ) {
		console.log( "delete_sensormodule Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#deletesensormodulehint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "delete_sensormodule Done", data );
		if (data.error) {
			$("#deletesensormodulehint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#deletesensormodulehint").attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_delete_sensor_module").popup( "close" );
			$("#deletesensormodulehint").html("&nbsp;");
		}
	})
	.always(function( data ) {
		console.log( "add_sensormodule Finished", data );
	});

}

// ADD SENSORINPUT: Popup

function popup_add_sensorinput() {

	var array = $('#sensorinput_module').val().split(',');
	var modulename = array[0];
	var module = array[1];

	// Set defaults
	$("#form_sensorinput_" + module)[0].reset();
	$("#edit_sensorinput_" + module).val('');
	$("#savinghint_sensorinput_" + module).html('&nbsp;');
	$('#sensormodule_sensorinput_' + module).val(modulename);
	// Open Popup
	$( "#popup_sensorinput_" + module ).popup( "open" )

}

// EDIT SENSORINPUT: Popup

function popup_edit_sensorinput(sensorinputname) {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "edit_sensorinput Fail", data );
		return;
	})
	.done(function( data ) {
		console.log( "edit_sensorinput Success", data );

		inputs = data.sensor_inputs;
		if ( data.error || jQuery.isEmptyObject(inputs)) {
			inputs = undefined;
			return;
		}
		modules = data.sensor_modules;
		if ( data.error || jQuery.isEmptyObject(modules)) {
			modules = undefined;
			return;
		}
		$.each( inputs, function( intDevId, item){
			if (item.name == sensorinputname) {
				var module;
				$.each( modules, function( intDevIdimod, itemmod){
					if (itemmod.name == item.module) {
						module = itemmod.module;
					}
				});
				if ( module === undefined ) {
					return;
				}
				$("#name_sensorinput_" + module).val(item.name);
				$("#sensormodule_sensorinput_" + module).val(item.module);
				$("#type_sensorinput_" + module).val(item.type).selectmenu('refresh',true);
				$("#pin_sensorinput_" + module).val(item.pin).selectmenu('refresh',true);
				$("#pin_trigger_sensorinput_" + module).val(item.pin_trigger).selectmenu('refresh',true);
				$("#pin_echo_sensorinput_" + module).val(item.pin_echo).selectmenu('refresh',true);
				$("#burst_sensorinput_" + module).val(item.burst);
				$("#oversampling_sensorinput_" + module).val(item.oversampling).selectmenu('refresh',true);
				$("#interval_sensorinput_" + module).val(item.interval);
				$("#factor_sensorinput_" + module).val(item.factor);
				$("#edit_sensorinput_" + module).val(item.name);
				// Open Popup
				$("#savinghint_sensorinput_" + module).html('&nbsp;');
				$("#popup_sensorinput_" + module ).popup( "open" );
			}
		});
	})
	.always(function( data ) {
		console.log( "edit_sensorinput Finished" );
	})

}

// ADD/EDIT SENSORINPUT (save to config)

function add_sensorinput(module) {

	//var checkboxvalues = [];
	//jQuery("input[name='checkbox']").each(function() {
	//checkboxvalues.push($(this).val());
	//});
	//test: countries.join(", "),

	$("#savinghint_sensorinput_" + module).attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_SAVING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'sensorinput',
				name: $("#name_sensorinput_" + module).val(),
				module: $("#sensormodule_sensorinput_" + module).val(),
				type: $("#type_sensorinput_" + module).val(),
				pin: $("#pin_sensorinput_" + module).val(),
				factor: $("#factor_sensorinput_" + module).val(),
				pin_trigger: $("#pin_trigger_sensorinput_" + module).val(),
				pin_echo: $("#pin_echo_sensorinput_" + module).val(),
				burst: $("#burst_sensorinput_" + module).val(),
				oversampling: $("#oversampling_sensorinput_" + module).val(),
				interval: $("#interval_sensorinput_" + module).val(),
				edit: $("#edit_sensorinput_" + module).val(),
			}
		} )
	.fail(function( data ) {
		console.log( "add_sensorinput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#savinghint_sensorinput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "add_sensorinput Done", data );
		if (data.error) {
			$("#savinghint_sensorinput_" + module).attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_SAVING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#savinghint_sensorinput_" + module).attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_sensorinput_" + module).popup( "close" );
			// Clean Popup
			$( "#form_sensorinput_" + module )[0].reset();
			$("#savinghint_sensorinput_" + module).html('&nbsp;');
		}
	})
	.always(function( data ) {
		console.log( "add_sensorinput Finished", data );
	});

}

// DELETE SENSORINPUT: Popup

function popup_delete_sensorinput(inputname) {

	$("#deletesensorinputhint").html('&nbsp;');
	$("#deletesensorinputname").html(inputname);
	$( "#popup_delete_sensor_input" ).popup( "open" )

}

// DELETE SENSORINPUT (save to config)

function delete_sensorinput() {

	$("#deletesensorinputhint").attr("style", "color:blue").html("<TMPL_VAR "COMMON.HINT_DELETING">");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'deletesensorinput',
				name: $("#deletesensorinputname").html(),
			}
		} )
	.fail(function( data ) {
		console.log( "delete_sensorinput Fail", data );
		var jsonresp = JSON.parse(data.responseText);
		$("#deletesensorinputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + jsonresp.error + " (Statuscode: " + data.status + ").");
	})
	.done(function( data ) {
		console.log( "delete_sensorinput Done", data );
		if (data.error) {
			$("#deletesensorinputhint").attr("style", "color:red").html("<TMPL_VAR "COMMON.HINT_DELETING_FAILED">" + " Error: " + data.error + ").");
		} else {
			$("#deletesensorinputhint").attr("style", "color:green").html("<TMPL_VAR "COMMON.HINT_SAVING_SUCCESS">" + ".");
			getconfig();
			// Close Popup
			$("#popup_delete_sensor_input").popup( "close" );
			$("#deletesensorinputhint").html("&nbsp;");
		}
	})
	.always(function( data ) {
		console.log( "add_sensorinput Finished", data );
	});

}

// UPGRADE - VERSIONS

function update_ver()
{
	$("#currentversion").html("<TMPL_VAR COMMON.HINT_UPDATING>");
	$("#availableversion").html("<TMPL_VAR COMMON.HINT_UPDATING>");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'getversions',
			}
		} )
	.done(function(resp) {
		console.log( "getversions", "success", resp );
		$("#currentversion").html(resp.versions.current);
		$("#availableversion").html(resp.versions.available);
		$(".UPGRADE").removeClass("ui-state-disabled");
	})
	.fail(function(resp) {
		console.log( "getversions", "fail", resp );
	})
	.always(function(resp) {
		console.log( "getversions", "finished", resp );
	});

}

// UPGRADE (save to config)

function upgrade() {
	$(".UPGRADE").addClass("ui-state-disabled");
	$("#currentversion").html("<TMPL_VAR COMMON.HINT_UPDATING>");
	$("#availableversion").html("<TMPL_VAR COMMON.HINT_UPDATING>");
	$("#savinghint_upgrade").attr("style", "color:blue").html("<TMPL_VAR UPGRADE.HINT_SAVE_SAVING>");
	console.log ("Upgrading MQTT-IO");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'upgrade',
			}
		} )
	.fail(function( data ) {
		console.log( "upgrade Fail", data );
		$("#savinghint_upgrade").attr("style", "color:red").html("<TMPL_VAR UPGRADE.HINT_SAVE_ERROR>: "+data.statusText);
	})
	.done(function( data ) {
		console.log( "upgrade Success: ", data );
		$("#savinghint_upgrade").attr("style", "color:green").html("<TMPL_VAR UPGRADE.HINT_SAVE_OK>");
	})
	.always(function( data ) {
		update_ver();
		$(".UPGRADE").removeClass("ui-state-disabled");
		console.log( "upgrade Finished" );
	});
}

// MQTT (save to config)

function saveMQTT() {
	$(".MQTT").addClass("ui-state-disabled");
	$("#savinghint_mqtt").attr("style", "color:blue").html("<TMPL_VAR COMMON.HINT_SAVING>");
	console.log ("Saving MQTT");
	$.ajax( { 
			url:  'ajax.cgi',
			type: 'POST',
			data: { 
				action: 'savemqtt',
				topic: $("#topic").val(),
			}
		} )
	.fail(function( data ) {
		console.log( "saving MQTT Fail", data );
		$("#savinghint_mqtt").attr("style", "color:red").html("<TMPL_VAR COMMON.HINT_SAVING_FAILED>: "+data.statusText);
	})
	.done(function( data ) {
		console.log( "saving MQTT Success: ", data );
		$("#savinghint_mqtt").attr("style", "color:green").html("<TMPL_VAR COMMON.HINT_SAVING_SUCCESS>");
	})
	.always(function( data ) {
		getconfig();
		$(".MQTT").removeClass("ui-state-disabled");
		console.log( "saving MQTT Finished" );
	});
}

// GET CONFIG

function getconfig() {

	// Ajax request
	$.ajax({ 
		url:  'ajax.cgi',
		type: 'POST',
		data: {
			action: 'getconfig'
		}
	})
	.fail(function( data ) {
		console.log( "getconfig Fail", data );
	})
	.done(function( data ) {
		console.log( "getconfig Success", data );
		$("#main").css( 'visibility', 'visible' );

		// MQTT

		console.log( "Parse Item for MQTT Settings" );
		$("#topic").val(data.mqtt.topic_prefix);

		// GPIO Modules

		console.log( "Parse Item for GPIO_MODULES" );
		modules = data.gpio_modules;
		// Sort by module, then by name: https://medium.com/developer-rants/sorting-json-structures-by-multiple-fields-in-javascript-60ed96704df7
		modules = modules.sort((a, b) => {
			let retval = 0;
			if (a.module < b.module)
				retval = -1;
			if (a.module > b.module)
				retval = 1;
			if (retval === 0)
				retval = a.name < b.name ? -1 : 1;
			return retval;
		});
		$('#gpiomodules-list').empty();
		if ( data.error || jQuery.isEmptyObject(modules)) {
			$('#gpiomodules-list').html("<TMPL_VAR GPIOS.HINT_NO_MODULES>");
			$('#digitaloutputs-list').html("<TMPL_VAR OUTPUTS.HINT_NO_OUTPUTS>");
			$('#digitalinputs-list').html("<TMPL_VAR INPUTS.HINT_NO_INPUTS>");
			modules = undefined;
		} else {
			// Create table
			var table = $('<table style="min-width:200px; width:100%" width="100%" data-role="table" id="gpiomodulestable" data-mode="reflow" class="ui-responsive table-stripe ui-body-b">').appendTo('#gpiomodules-list');
			// Add the header row
			var theader = $('<thead />').appendTo(table);
			var theaderrow = $('<tr class="ui-bar-b"/>').appendTo(theader);
			$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR COMMON.LABEL_NAME><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR GPIOS.LABEL_MODULE><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:20%; padding:5px;"><TMPL_VAR COMMON.LABEL_ACTIONS><\/th>').appendTo(theaderrow);
			// Create table body.
			var tbody = $('<tbody />').appendTo(table);
			// Add the data rows to the table body and dropdown lists
			$('#digitaloutput_module').empty();
			$('#digitalinput_module').empty();
			$.each( modules, function( intDevId, item){
				// Dropdown list for Digital inputs/outputs
				$('<option value=\'' + item.name + ',' + item.module + '\'>' + item.name + '</option/>').appendTo('#digitaloutput_module');
				$('<option value=\'' + item.name + ',' + item.module + '\'>' + item.name + '</option/>').appendTo('#digitalinput_module');
				// Table
				var row = $('<tr />').appendTo(tbody);
				$('<td style="text-align:left;">'+item.name+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.module+'<\/td>').appendTo(row);
				$('<td />', { html: '\
				<a href="javascript:popup_edit_gpiomodule(\'' + item.name + '\')" id="btneditgpiomodule_'+item.name+'" name="btneditgpiomodule_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_EDIT> ' + item.name + '"> \
				<img src="./images/settings_20.png" height="20"></img></a> \
				<a href="javascript:popup_delete_gpiomodule(\'' + item.name + '\')" id="btnaskdeletegpiomodule_'+item.name+'" name="btnaskdeletegpiomodule_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_DELETE> ' + item.name + '"> \
				<img src="./images/cancel_20.png" height="20"></img></a> \
				' }).appendTo(row);
				$(row).trigger("create");
			});
			$("#digitaloutput_module").trigger("change");
			$("#digitalinput_module").trigger("change");
		};

		// Outputs

		console.log( "Parse Item for OUTPUTS" );
		outputs = data.digital_outputs;
		// Sort by module, then by name: https://medium.com/developer-rants/sorting-json-structures-by-multiple-fields-in-javascript-60ed96704df7
		outputs = outputs.sort((a, b) => {
			let retval = 0;
			if (a.module < b.module)
				retval = -1;
			if (a.module > b.module)
				retval = 1;
			if (retval === 0)
				retval = a.name < b.name ? -1 : 1;
			return retval;
		});
		$('#digitaloutputs-list').empty();
		if ( data.error || jQuery.isEmptyObject(outputs)) {
			$('#digitaloutputs-list').html("<TMPL_VAR OUTPUTS.HINT_NO_OUTPUTS>");
			outputs = undefined;
		} else {
			// Create table
			var table = $('<table style="min-width:200px; width:100%" width="100%" data-role="table" id="digitaloutputstable" data-mode="reflow" class="ui-responsive table-stripe ui-body-b">').appendTo('#digitaloutputs-list');
			// Add the header row
			var theader = $('<thead />').appendTo(table);
			var theaderrow = $('<tr class="ui-bar-b"/>').appendTo(theader);
			$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR COMMON.LABEL_NAME><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:30%; padding:5px;"><TMPL_VAR GPIOS.LABEL_MODULE><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:10%; padding:5px;"><TMPL_VAR OUTPUTS.LABEL_PIN><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:20%; padding:5px;"><TMPL_VAR COMMON.LABEL_ACTIONS><\/th>').appendTo(theaderrow);
			// Create table body.
			var tbody = $('<tbody />').appendTo(table);
			// Add the data rows to the table body.
			$.each( outputs, function( intDevId, item){
				var row = $('<tr />').appendTo(tbody);
				$('<td style="text-align:left;">'+item.name+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.module+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.pin+'<\/td>').appendTo(row);
				$('<td />', { html: '\
				<a href="javascript:popup_edit_digitaloutput(\'' + item.name + '\')" id="btneditdigitaloutput_'+item.name+'" name="btneditdigitaloutput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_EDIT> ' + item.name + '"> \
				<img src="./images/settings_20.png" height="20"></img></a> \
				\
				<a href="javascript:popup_delete_digitaloutput(\'' + item.name + '\')" id="btnaskdeletedigitaloutput_'+item.name+'" name="btnaskdeletedigitaloutput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_DELETE> ' + item.name + '"> \
				<img src="./images/cancel_20.png" height="20"></img></a> \
				' }).appendTo(row);
				$(row).trigger("create");
			});
		};

		// Inputs

		console.log( "Parse Item for INPUTS" );
		inputs = data.digital_inputs;
		// Sort by module, then by name: https://medium.com/developer-rants/sorting-json-structures-by-multiple-fields-in-javascript-60ed96704df7
		inputs = inputs.sort((a, b) => {
			let retval = 0;
			if (a.module < b.module)
				retval = -1;
			if (a.module > b.module)
				retval = 1;
			if (retval === 0)
				retval = a.name < b.name ? -1 : 1;
			return retval;
		});
		$('#digitalinputs-list').empty();
		if ( data.error || jQuery.isEmptyObject(inputs)) {
			$('#digitalinputs-list').html("<TMPL_VAR INPUTS.HINT_NO_INPUTS>");
			inputs = undefined;
		} else {
			// Create table
			var table = $('<table style="min-width:200px; width:100%" width="100%" data-role="table" id="digitalinputstable" data-mode="reflow" class="ui-responsive table-stripe ui-body-b">').appendTo('#digitalinputs-list');
			// Add the header row
			var theader = $('<thead />').appendTo(table);
			var theaderrow = $('<tr class="ui-bar-b"/>').appendTo(theader);
			$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR COMMON.LABEL_NAME><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:30%; padding:5px;"><TMPL_VAR GPIOS.LABEL_MODULE><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:10%; padding:5px;"><TMPL_VAR INPUTS.LABEL_PIN><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:20%; padding:5px;"><TMPL_VAR COMMON.LABEL_ACTIONS><\/th>').appendTo(theaderrow);
			// Create table body.
			var tbody = $('<tbody />').appendTo(table);
			// Add the data rows to the table body.
			$.each( inputs, function( intDevId, item){
				var row = $('<tr />').appendTo(tbody);
				$('<td style="text-align:left;">'+item.name+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.module+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.pin+'<\/td>').appendTo(row);
				$('<td />', { html: '\
				<a href="javascript:popup_edit_digitalinput(\'' + item.name + '\')" id="btneditdigitalinput_'+item.name+'" name="btneditdigitalinput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_EDIT> ' + item.name + '"> \
				<img src="./images/settings_20.png" height="20"></img></a> \
				\
				<a href="javascript:popup_delete_digitalinput(\'' + item.name + '\')" id="btnaskdeletedigitalinput_'+item.name+'" name="btnaskdeletedigitalinput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_DELETE> ' + item.name + '"> \
				<img src="./images/cancel_20.png" height="20"></img></a> \
				' }).appendTo(row);
				$(row).trigger("create");
			});
		};

		// Sensor Modules

		console.log( "Parse Item for SENSOR_MODULES" );
		modules = data.sensor_modules;
		// Sort by module, then by name: https://medium.com/developer-rants/sorting-json-structures-by-multiple-fields-in-javascript-60ed96704df7
		modules = modules.sort((a, b) => {
			let retval = 0;
			if (a.module < b.module)
				retval = -1;
			if (a.module > b.module)
				retval = 1;
			if (retval === 0)
				retval = a.name < b.name ? -1 : 1;
			return retval;
		});
		$('#sensormodules-list').empty();
		if ( data.error || jQuery.isEmptyObject(modules)) {
			$('#sensormodules-list').html("<TMPL_VAR SENSORS.HINT_NO_MODULES>");
			$('#sensorinputs-list').html("<TMPL_VAR SENSORINPUTS.HINT_NO_INPUTS>");
			modules = undefined;
			return;
		}
		// Create table
		var table = $('<table style="min-width:200px; width:100%" width="100%" data-role="table" id="sensormodulestable" data-mode="reflow" class="ui-responsive table-stripe ui-body-b">').appendTo('#sensormodules-list');
		// Add the header row
		var theader = $('<thead />').appendTo(table);
		var theaderrow = $('<tr class="ui-bar-b"/>').appendTo(theader);
		$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR COMMON.LABEL_NAME><\/th>').appendTo(theaderrow);
		$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR GPIOS.LABEL_MODULE><\/th>').appendTo(theaderrow);
		$('<th style="text-align:left; width:20%; padding:5px;"><TMPL_VAR COMMON.LABEL_ACTIONS><\/th>').appendTo(theaderrow);
		// Create table body.
		var tbody = $('<tbody />').appendTo(table);
		// Add the data rows to the table body and dropdown lists
		$('#sensorinput_module').empty();
		$.each( modules, function( intDevId, item){
			// Dropdown list for Sensor inputs/outputs
			$('<option value=\'' + item.name + ',' + item.module + '\'>' + item.name + '</option/>').appendTo('#sensorinput_module');
			// Table
			var row = $('<tr />').appendTo(tbody);
			$('<td style="text-align:left;">'+item.name+'<\/td>').appendTo(row);
			$('<td style="text-align:left;">'+item.module+'<\/td>').appendTo(row);
			$('<td />', { html: '\
			<a href="javascript:popup_edit_sensormodule(\'' + item.name + '\')" id="btneditsensormodule_'+item.name+'" name="btneditsensormodule_'+item.name+'" \
			title="<TMPL_VAR COMMON.BUTTON_EDIT> ' + item.name + '"> \
			<img src="./images/settings_20.png" height="20"></img></a> \
			<a href="javascript:popup_delete_sensormodule(\'' + item.name + '\')" id="btnaskdeletesensormodule_'+item.name+'" name="btnaskdeletesensormodule_'+item.name+'" \
			title="<TMPL_VAR COMMON.BUTTON_DELETE> ' + item.name + '"> \
			<img src="./images/cancel_20.png" height="20"></img></a> \
			' }).appendTo(row);
			$(row).trigger("create");
		});
		$("#sensorinput_module").trigger("change");

		// Sensor Inputs

		console.log( "Parse Item for SENSORINPUTS" );
		inputs = data.sensor_inputs;
		// Sort by module, then by name: https://medium.com/developer-rants/sorting-json-structures-by-multiple-fields-in-javascript-60ed96704df7
		inputs = inputs.sort((a, b) => {
			let retval = 0;
			if (a.module < b.module)
				retval = -1;
			if (a.module > b.module)
				retval = 1;
			if (retval === 0)
				retval = a.name < b.name ? -1 : 1;
			return retval;
		});
		$('#sensorinputs-list').empty();
		if ( data.error || jQuery.isEmptyObject(inputs)) {
			$('#sensorinputs-list').html("<TMPL_VAR SENSORINPUTS.HINT_NO_INPUTS>");
			inputs = undefined;
		} else {
			// Create table
			var table = $('<table style="min-width:200px; width:100%" width="100%" data-role="table" id="sensorinputstable" data-mode="reflow" class="ui-responsive table-stripe ui-body-b">').appendTo('#sensorinputs-list');
			// Add the header row
			var theader = $('<thead />').appendTo(table);
			var theaderrow = $('<tr class="ui-bar-b"/>').appendTo(theader);
			$('<th style="text-align:left; width:40%; padding:5px;"><TMPL_VAR COMMON.LABEL_NAME><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:30%; padding:5px;"><TMPL_VAR GPIOS.LABEL_MODULE><\/th>').appendTo(theaderrow);
			$('<th style="text-align:left; width:20%; padding:5px;"><TMPL_VAR COMMON.LABEL_ACTIONS><\/th>').appendTo(theaderrow);
			// Create table body.
			var tbody = $('<tbody />').appendTo(table);
			// Add the data rows to the table body.
			$.each( inputs, function( intDevId, item){
				var row = $('<tr />').appendTo(tbody);
				$('<td style="text-align:left;">'+item.name+'<\/td>').appendTo(row);
				$('<td style="text-align:left;">'+item.module+'<\/td>').appendTo(row);
				$('<td />', { html: '\
				<a href="javascript:popup_edit_sensorinput(\'' + item.name + '\')" id="btneditsensorinput_'+item.name+'" name="btneditsensorinput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_EDIT> ' + item.name + '"> \
				<img src="./images/settings_20.png" height="20"></img></a> \
				\
				<a href="javascript:popup_delete_sensorinput(\'' + item.name + '\')" id="btnaskdeletesensorinput_'+item.name+'" name="btnaskdeletesensorinput_'+item.name+'" \
				title="<TMPL_VAR COMMON.BUTTON_DELETE> ' + item.name + '"> \
				<img src="./images/cancel_20.png" height="20"></img></a> \
				' }).appendTo(row);
				$(row).trigger("create");
			});
		};

	})
	.always(function( data ) {
		console.log( "getconfig Finished" );
	})

}

</script>
