#!/usr/bin/perl

# Copyright 2019 Michael Schlenstedt, michael@loxberry.de
#                Christian Fenzl, christian@loxberry.de
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


##########################################################################
# Modules
##########################################################################

use CGI;
use LoxBerry::System;
use LoxBerry::JSON; # Available with LoxBerry 2.0
use LoxBerry::Log;
use warnings;
use strict;
#use Data::Dumper;

##########################################################################
# Variables
##########################################################################

my $log;

# Read Form
my $cgi = CGI->new;
my $q = $cgi->Vars;

my $version = LoxBerry::System::pluginversion();
my $template;
my $templateout;

# Language Phrases
my %L;

# Globals 

##########################################################################
# AJAX
##########################################################################

if( $q->{ajax} ) {
	
	## Handle all ajax requests 
	require JSON;
	# require Time::HiRes;
	my %response;
	ajax_header();

	exit;

##########################################################################
# Normal request (not AJAX)
##########################################################################

} else {

	require LoxBerry::Web;

	# Default is gpio_settings form
	$q->{form} = "gpios" if !$q->{form};

	if ($q->{form} eq "sensors") {
		my $templatefile = "$lbptemplatedir/sensor_settings.html";
		$template = LoxBerry::System::read_file($templatefile);
		&form_sensors();
	}
	elsif ($q->{form} eq "mqtt") {
		my $templatefile = "$lbptemplatedir/mqtt_settings.html";
		$template = LoxBerry::System::read_file($templatefile);
		&form_mqtt();
	}
	elsif ($q->{form} eq "upgrade") {
		my $templatefile = "$lbptemplatedir/upgrade_settings.html";
		$template = LoxBerry::System::read_file($templatefile);
		&form_upgrade();
	}
	elsif ($q->{form} eq "logs") {
		my $templatefile = "$lbptemplatedir/log_settings.html";
		$template = LoxBerry::System::read_file($templatefile);
		&form_logs();
	}
	else {
		my $templatefile = "$lbptemplatedir/gpio_settings.html";
		$template = LoxBerry::System::read_file($templatefile);
		&form_gpios();
	}

}

# Print the form out
&printtemplate();

exit;

##########################################################################
# Form: GPIO Settings
##########################################################################

sub form_gpios
{
	# Read GPIO Modules templates
	opendir(my $fh,"$lbptemplatedir/gpiomodules");
	my @files = readdir($fh);
	close $fh;

	my $options;
	foreach (sort @files) {
		if ( $_ =~ /.*\.html/ ) {
			$template = $template .= LoxBerry::System::read_file("$lbptemplatedir/gpiomodules/$_");
			$_ =~ s/\.html//g;
			$options .= "<option value='$_'>$_</option>";
		}
	}

	# Read DIGITALOUTPUT templates
	opendir(my $fh,"$lbptemplatedir/digitaloutputs");
	my @files = readdir($fh);
	close $fh;

	foreach (sort @files) {
		if ( $_ =~ /.*\.html/ ) {
			$template = $template .= LoxBerry::System::read_file("$lbptemplatedir/digitaloutputs/$_");
			$_ =~ s/\.html//g;
		}
	}

	# Read DIGITALINPUT templates
	opendir(my $fh,"$lbptemplatedir/digitalinputs");
	my @files = readdir($fh);
	close $fh;

	foreach (sort @files) {
		if ( $_ =~ /.*\.html/ ) {
			$template = $template .= LoxBerry::System::read_file("$lbptemplatedir/digitalinputs/$_");
			$_ =~ s/\.html//g;
		}
	}

	# Prepare template
	&preparetemplate();

	# Template Variables
	$templateout->param("GPIO_MODULE_OPTIONS", $options);

	return();
}

##########################################################################
# Form: Sensors
##########################################################################

sub form_sensors
{
	# Read Sensor Modules templates
	opendir(my $fh,"$lbptemplatedir/sensormodules");
	my @files = readdir($fh);
	close $fh;

	my $options;
	foreach (sort @files) {
		if ( $_ =~ /.*\.html/ ) {
			$template = $template .= LoxBerry::System::read_file("$lbptemplatedir/sensormodules/$_");
			$_ =~ s/\.html//g;
			$options .= "<option value='$_'>$_</option>";
		}
	}

	# Read SENSORINPUT templates
	opendir(my $fh,"$lbptemplatedir/sensorinputs");
	my @files = readdir($fh);
	close $fh;

	foreach (sort @files) {
		if ( $_ =~ /.*\.html/ ) {
			$template = $template .= LoxBerry::System::read_file("$lbptemplatedir/sensorinputs/$_");
			$_ =~ s/\.html//g;
		}
	}

	# Prepare template
	&preparetemplate();

	# Template Variables
	$templateout->param("SENSOR_MODULE_OPTIONS", $options);

	return();
}

##########################################################################
# Form: Mqtt
##########################################################################

sub form_mqtt
{
	# Prepare template
	&preparetemplate();

	return();
}


##########################################################################
# Form: Upgrade
##########################################################################

sub form_upgrade
{
	# Prepare template
	&preparetemplate();

	return();
}


##########################################################################
# Form: Log
##########################################################################

sub form_logs
{
	# Prepare template
	&preparetemplate();

	$templateout->param("LOGLIST", LoxBerry::Web::loglist_html());

	return();
}

##########################################################################
# Print Form
##########################################################################

sub preparetemplate
{

	# Add JS Scripts
	my $templatefile = "$lbptemplatedir/javascript.js";
	$template .= LoxBerry::System::read_file($templatefile);

	$templateout = HTML::Template->new_scalar_ref(
		\$template,
		global_vars => 1,
		loop_context_vars => 1,
		die_on_bad_params => 0,
	);

	# Language File
	%L = LoxBerry::System::readlanguage($templateout, "language.ini");

	# Navbar
	our %navbar;

	$navbar{10}{Name} = "$L{'COMMON.LABEL_GPIOS'}";
	$navbar{10}{URL} = 'index.cgi?form=gpios';
	$navbar{10}{active} = 1 if $q->{form} eq "gpios";

	$navbar{20}{Name} = "$L{'COMMON.LABEL_SENSORS'}";
	$navbar{20}{URL} = 'index.cgi?form=sensors';
	$navbar{20}{active} = 1 if $q->{form} eq "sensors";

	$navbar{30}{Name} = "$L{'COMMON.LABEL_MQTT'}";
	$navbar{30}{URL} = 'index.cgi?form=mqtt';
	$navbar{30}{active} = 1 if $q->{form} eq "mqtt";

	$navbar{40}{Name} = "$L{'COMMON.LABEL_UPGRADE'}";
	$navbar{40}{URL} = 'index.cgi?form=upgrade';
	$navbar{40}{active} = 1 if $q->{form} eq "upgrade";

	$navbar{98}{Name} = "$L{'COMMON.LABEL_LOGS'}";
	$navbar{98}{URL} = 'index.cgi?form=logs';
	$navbar{98}{active} = 1 if $q->{form} eq "logs";

	return();
}

sub printtemplate
{

	# Print out Template
	LoxBerry::Web::lbheader($L{'COMMON.LABEL_PLUGINTITLE'} . " V$version", "https://wiki.loxberry.de/plugins/multi_io/start", "");
	print $templateout->output();
	LoxBerry::Web::lbfooter();
	
	return();

}

######################################################################
# AJAX functions
######################################################################

sub ajax_header
{
	print $cgi->header(
			-type => 'application/json',
			-charset => 'utf-8',
			-status => '200 OK',
	);
}
