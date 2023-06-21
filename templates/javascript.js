<script>

$(function() {
	
	interval = window.setInterval(function(){ servicestatus(); }, 3000);
	servicestatus();
	getconfig();

});

// SERVICE STATE

function servicestatus(update) {

	if (update) {
		$("#servicestatus").attr("style", "background:#dfdfdf").html("<TMPL_VAR "COMMON.HINT_UPDATING">");
		$("#servicestatusicon").html("<img src='./images/unknown_20.png'>");
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

	clearInterval(interval);
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
			servicestatus(1);
		} else {
			$("#servicestatus").attr("style", "background:#dfdfdf; color:red").html("<TMPL_VAR "COMMON.HINT_FAILED">");
		}
		interval = window.setInterval(function(){ servicestatus(); }, 5000);
	})
	.always(function( data ) {
		console.log( "Servicerestart Finished", data );
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
				$("#chipaddr_" + item.module).val(item.chipaddr).selectmenu('refresh',true);
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
				chipaddr: $("#chipaddr_" + module).val(),
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
				let module;
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
				$("#payload_on_digitaloutput_" + module).val(item.on_payload);
				$("#payload_off_digitaloutput_" + module).val(item.off_payload);
				if ( item.inverted == "true" ) {
					$("#inverted_digitaloutput_" + module).prop('checked', true).checkboxradio('refresh');
				} else {
					$("#inverted_digitaloutput_" + module).prop('checked', false).checkboxradio('refresh');
				}
				$("#initial_digitaloutput_" + module).val(item.initial).selectmenu('refresh',true);
				$("#timed_ms_digitaloutput_" + module).val(item.timed_ms);
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
				payload_on: $("#payload_on_digitaloutput_" + module).val(),
				payload_off: $("#payload_off_digitaloutput_" + module).val(),
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
		nmodules = data.gpio_modules;
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
				let module;
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

		// GPIO Modules

		console.log( "Parse Item for GPIO_MODULES" );
		modules = data.gpio_modules;
		$('#gpiomodules-list').empty();
		if ( data.error || jQuery.isEmptyObject(modules)) {
			$('#gpiomodules-list').html("<TMPL_VAR GPIOS.HINT_NO_MODULES>");
			$('#digitaloutputs-list').html("<TMPL_VAR OUTPUTS.HINT_NO_OUTPUTS>");
			modules = undefined;
			return;
		}
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

		// Outputs

		console.log( "Parse Item for OUTPUTS" );
		outputs = data.digital_outputs;
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
	})
	.always(function( data ) {
		console.log( "getconfig Finished" );
	})

}

</script>
