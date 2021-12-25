#!/usr/bin/perl
use warnings;
use strict;
use LoxBerry::System;
use LoxBerry::Log;
use CGI;
use JSON;

my $error;
my $response;
my $cgi = CGI->new;
my $q = $cgi->Vars;

my $log = LoxBerry::Log->new (
    name => 'AJAX',
	stderr => 1,
	loglevel => 7
);

LOGSTART "Request $q->{action}";


if( $q->{action} eq "servicerestart" ) {
	system ("$lbpbindir/watchdog.pl --action=restart --verbose=1 > /dev/null 2>&1");
	$response = $?;
}

if( $q->{action} eq "servicestatus" ) {
	my $status;
	my $count = `pgrep -c -f "python3 -m pi_mqtt_gpio.server /dev/shm/mqttio.yaml"`;
	if ($count >= "2") {
		$status = `pgrep -o -f "python3 -m pi_mqtt_gpio.server /dev/shm/mqttio.yaml"`;
	}
	my %response = (
		pid => $status,
	);
	chomp (%response);
	$response = encode_json( \%response );
}

if( $q->{action} eq "getconfig" ) {
	if ( -e "$lbpconfigdir/mqttio.json" ) {
		$response = LoxBerry::System::read_file("$lbpconfigdir/mqttio.json");
		if( !$response ) {
			$response = "{ }";
		}
	}
	else {
		$response = "{ }";
	}
}

if( $q->{action} eq "gpiomodule" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}
	if (!defined $q->{'module'} || $q->{'module'} eq "") {
		$error = "Module cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Check if name already exists
	if ( !$q->{'edit'} && $q->{'name'} ) {
		my @searchresult = $jsonobj->find( $cfg->{'gpio_modules'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		#my $elemKey = $searchresult[0];
		if (@searchresult) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}
	# Add new module
	if (!$error && !$q->{'edit'}) {
		my %module = (
			name => $q->{'name'},
			module => $q->{'module'},
		);
		push @{$cfg->{'gpio_modules'}}, \%module;
		$jsonobj->write();
	}
	# Edit existing  module
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'gpio_modules'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		my $elemKey = $searchresult[0];
		$cfg->{'gpio_modules'}->[$elemKey]->{'name'} = $q->{'name'};
		# ##########################################
		# ADD HERE CHANGING ALL INPUTS AND OUTOUTS
		# ##########################################
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

#####################################
# Manage Response and error
#####################################

if( defined $response and !defined $error ) {
	print "Status: 200 OK\r\n";
	print "Content-type: application/json; charset=utf-8\r\n\r\n";
	print $response;
	LOGOK "Parameters ok - responding with HTTP 200";
}
elsif ( defined $error and $error ne "" ) {
	print "Status: 500 Internal Server Error\r\n";
	print "Content-type: application/json; charset=utf-8\r\n\r\n";
	print to_json( { error => $error } );
	LOGCRIT "$error - responding with HTTP 500";
}
else {
	print "Status: 501 Not implemented\r\n";
	print "Content-type: application/json; charset=utf-8\r\n\r\n";
	$error = "Action ".$q->{action}." unknown";
	LOGCRIT "Method not implemented - responding with HTTP 501";
	print to_json( { error => $error } );
}

END {
	LOGEND if($log);
}
