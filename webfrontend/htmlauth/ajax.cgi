#!/usr/bin/perl
use warnings;
use strict;
use LoxBerry::System;
use LoxBerry::Log;
use CGI;
use JSON;
use Data::Dumper;

my $error;
my $response;
my $cgi = CGI->new;
my $q = $cgi->Vars;

#print STDERR Dumper $q;

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

if( $q->{action} eq "servicestop" ) {
	system ("$lbpbindir/watchdog.pl --action=stop --verbose=1 > /dev/null 2>&1");
	$response = $?;
}

if( $q->{action} eq "servicestatus" ) {
	my $status;
	my $count = `pgrep -c -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	if ($count >= "2") {
		$status = `pgrep -o -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	}
	my %response = (
		pid => $status,
	);
	chomp (%response);
	$response = encode_json( \%response );
}

if( $q->{action} eq "getversions" ) {
	my %versions;
	my %response;
	$versions{'current'} = execute("$lbpbindir/upgrade.sh current");
	$versions{'available'} = execute("$lbpbindir/upgrade.sh available");
	$response{'versions'} = \%versions;
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

if( $q->{action} eq "upgrade" ) {
	my %response;
	my ($exitcode, $output) = execute("sudo $lbpbindir/upgrade.sh");
	$response = $exitcode;
}

if( $q->{action} eq "savemqtt" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'topic'} || $q->{'topic'} eq "") {
		$q->{'topic'} = "multiio";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	$cfg->{'mqtt'}->{'topic_prefix'} = $q->{'topic'};
	$jsonobj->write();
	my $resp = LoxBerry::System::write_file("$lbpconfigdir" . "/mqtt_subscriptions.cfg", $q->{'topic'} . "/#");
	$response = 0;
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
		if (scalar(@searchresult) > 0) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}
	
	# Edit existing  module
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'gpio_modules'}, "\$_->{'name'} eq \"" . $q->{'edit'} . "\"" );
		my $elemKey = $searchresult[0];
		splice @{ $cfg->{'gpio_modules'} }, $elemKey, 1 if (defined($elemKey));
		# Edit all digital outputs and inputs
		my @searchresult = $jsonobj->find( $cfg->{'digital_outputs'}, "\$_->{'module'} eq \"" . $q->{'edit'} . "\"" );
		foreach $elemKey (@searchresult) {
			$cfg->{'digital_outputs'}->[$elemKey]->{'module'} = $q->{'name'};
		}
		my @searchresult = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'module'} eq \"" . $q->{'edit'} . "\"" );
		foreach $elemKey (@searchresult) {
			$cfg->{'digital_inputs'}->[$elemKey]->{'module'} = $q->{'name'};
		}
	}
	
	# Add new/eddited module
	if (!$error) {
		# Required
		my %module = (
			name => $q->{'name'},
			module => $q->{'module'},
		);
		# Optional
		$module{'i2c_bus_num'} = $q->{'i2c_bus_num'} if ($q->{'i2c_bus_num'} ne "");
		$module{'chip_addr'} = $q->{'chip_addr'} if ($q->{'chip_addr'} ne "");
		# Save
		push @{$cfg->{'gpio_modules'}}, \%module;
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "deletegpiomodule" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Delete existing  module
	my @searchresult = $jsonobj->find( $cfg->{'gpio_modules'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
	my $elemKey = $searchresult[0];
	splice @{ $cfg->{'gpio_modules'} }, $elemKey, 1 if (defined($elemKey));
	# Delete all digital outputs and inputs
	@searchresult = $jsonobj->find( $cfg->{'digital_outputs'}, "\$_->{'module'} eq \"" . $q->{'name'} . "\"" );
	for my $elemKey (reverse sort @searchresult) {
		splice @{ $cfg->{'digital_outputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	@searchresult = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'module'} eq \"" . $q->{'name'} . "\"" );
	for my $elemKey (reverse sort @searchresult) {
		splice @{ $cfg->{'digital_inputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	$jsonobj->write();
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "digitaloutput" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}
	if (!defined $q->{'module'} || $q->{'module'} eq "") {
		$error = "Module cannot be empty";
	}
	if (!defined $q->{'pin'} || $q->{'pin'} eq "") {
		$error = "Pin cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Check if name already exists
	if ( !$q->{'edit'} && $q->{'name'} ) {
		my @searchresult = $jsonobj->find( $cfg->{'digital_outputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		#my $elemKey = $searchresult[0];
		if (scalar(@searchresult) > 0) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}
	# Edit existing output
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'digital_outputs'}, "\$_->{'name'} eq \"" . $q->{'edit'} . "\"" );
		my $elemKey = $searchresult[0];
		splice @{ $cfg->{'digital_outputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	# Add new/edited output
	if (!$error) {
		# Required
		my %digitaloutput = (
			name => $q->{'name'},
			module => $q->{'module'},
			pin => $q->{'pin'},
			retain => 'true',
			publish_initial => 'true',
		);
		# Optional
		$digitaloutput{'timed_set_ms'} = int($q->{'timed_ms'}) if ($q->{'timed_ms'} ne "" && $q->{'timed_ms'} > 0);
		$digitaloutput{'initial'} = $q->{'initial'} if ($q->{'initial'} ne "");
		$digitaloutput{'on_payload'} = $q->{'payload_on'} ne "ON" ? $q->{'payload_on'} : "ON";
		$digitaloutput{'off_payload'} = $q->{'payload_off'} ne "OFF" ? $q->{'payload_off'} : "OFF";
		$digitaloutput{'inverted'} = $q->{'inverted'} if ($q->{'inverted'} ne "");

		# Save
		push @{$cfg->{'digital_outputs'}}, \%digitaloutput;
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "deletedigitaloutput" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Delete existing output
	my @searchresult = $jsonobj->find( $cfg->{'digital_outputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
	my $elemKey = $searchresult[0];
	splice @{ $cfg->{'digital_outputs'} }, $elemKey, 1 if (defined($elemKey));
	$jsonobj->write();
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "digitalinput" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}
	if (!defined $q->{'module'} || $q->{'module'} eq "") {
		$error = "Module cannot be empty";
	}
	if (!defined $q->{'pin'} || $q->{'pin'} eq "") {
		$error = "Pin cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Check if name already exists
	if ( !$q->{'edit'} && $q->{'name'} ) {
		my @searchresult = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		#my $elemKey = $searchresult[0];
		if (scalar(@searchresult) > 0) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}
	# Edit existing input
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'name'} eq \"" . $q->{'edit'} . "\"" );
		my $elemKey = $searchresult[0];
		splice @{ $cfg->{'digital_inputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	# Add new/edited output
	if (!$error) {
		# Required
		my %digitalinput = (
			name => $q->{'name'},
			module => $q->{'module'},
			pin => $q->{'pin'},
			retain => 'true',
		);
		# Optional
		$digitalinput{'on_payload'} = $q->{'payload_on'} ne "ON" ? $q->{'payload_on'} : "ON";
		$digitalinput{'off_payload'} = $q->{'payload_off'} ne "OFF" ? $q->{'payload_off'} : "OFF";
		$digitalinput{'inverted'} = $q->{'inverted'};
		$digitalinput{'pullup'} = "true" if ($q->{'resistor'} eq "pullup");
		$digitalinput{'pulldown'} = "true" if ($q->{'resistor'} eq "pulldown");
		$digitalinput{'bouncetime'} = int($q->{'bouncetime'}) if ($q->{'bouncetime'} ne "");
		$digitalinput{'interrupt'} = $q->{'interrupt'} if ($q->{'interrupt'} ne "none" );
		$digitalinput{'poll_interval'} = $q->{'pollinterval'} if ($q->{'pollinterval'} ne "");
		$digitalinput{'poll_interval'} =~ tr/,/./;
		$digitalinput{'poll_when_interrupt_for'} = "true" if ($q->{'pollinterval'} ne "" && $q->{'interruptfor'} && $q->{'interruptfor'} ne "none" );
		my @interruptsfor;
		if ($q->{'interruptfor'} && $q->{'interruptfor'} ne "none") {
			my @searchresultintfor = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'module'} eq \"" . $q->{'interruptfor'} . "\"" );
			foreach (@searchresultintfor) {
				push @interruptsfor, $cfg->{'digital_inputs'}[$_]->{'name'};
			}
			$digitalinput{'interrupt_for'} = \@interruptsfor;
		}
		# Adjust "interrupt_for" if somewhere defined for this module
		if ($q->{'interrupt'} ne "none" && $q->{'interrupt'} ne "" && (!$q->{'interruptfor'}) || $q->{'interruptfor'} eq "none") {
			my $i = -1;
			foreach (@{$cfg->{'digital_inputs'}}) {
				$i++;
				next if !$cfg->{'digital_inputs'}[$i]->{'interrupt_for'};
				my $firstfoundname = $cfg->{'digital_inputs'}[$i]->{'interrupt_for'}[0];
				my @searchresultfirstname = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'name'} eq \"" . $firstfoundname . "\"" );
				next if $cfg->{'digital_inputs'}[$searchresultfirstname[0]]->{'module'} ne $q->{'module'}; # Not for me
				my @interruptsfor = @{$cfg->{'digital_inputs'}[$i]->{'interrupt_for'}};
				push @interruptsfor, $q->{'name'};
				$cfg->{'digital_inputs'}[$i]->{'interrupt_for'} = \@interruptsfor;
				last;
			}
		}

		# Save
		push @{$cfg->{'digital_inputs'}}, \%digitalinput;
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "deletedigitalinput" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Delete existing output
	my @searchresult = $jsonobj->find( $cfg->{'digital_inputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
	my $elemKey = $searchresult[0];
	splice @{ $cfg->{'digital_inputs'} }, $elemKey, 1 if (defined($elemKey));
	$jsonobj->write();
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "sensormodule" ) {

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
		my @searchresult = $jsonobj->find( $cfg->{'sensor_modules'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		#my $elemKey = $searchresult[0];
		if (scalar(@searchresult) > 0) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}

	# Edit existing  module
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'sensor_modules'}, "\$_->{'name'} eq \"" . $q->{'edit'} . "\"" );
		my $elemKey = $searchresult[0];
		splice @{ $cfg->{'sensor_modules'} }, $elemKey, 1 if (defined($elemKey));
		# Edit all digital outputs and inputs
		my @searchresult = $jsonobj->find( $cfg->{'sensor_inputs'}, "\$_->{'module'} eq \"" . $q->{'edit'} . "\"" );
		foreach $elemKey (@searchresult) {
			$cfg->{'sensor_inputs'}->[$elemKey]->{'module'} = $q->{'name'};
		}
	}
	
	# Add new/eddited module
	if (!$error) {
		# Required
		my %module = (
			name => $q->{'name'},
			module => $q->{'module'},
		);
		# Optional
		$module{'i2c_bus_num'} = $q->{'i2c_bus_num'} if ($q->{'i2c_bus_num'} ne "");
		$module{'chip_addr'} = $q->{'chip_addr'} if ($q->{'chip_addr'} ne "");
		$module{'pin'} = $q->{'pin'} if ($q->{'pin'} ne "");
		$module{'type'} = $q->{'type'} if ($q->{'type'} ne "");
		$module{'gain'} = $q->{'gain'} if ($q->{'gain'} ne "");
		$module{'integration_time'} = $q->{'integration_time'} if ($q->{'integration_time'} ne "");
		$module{'shunt_ohms'} = $q->{'shunt_ohms'} if ($q->{'shunt_ohms'} ne "");
		$module{'max_amps'} = $q->{'max_amps'} if ($q->{'max_amps'} ne "");
		$module{'voltage_range'} = $q->{'voltage_range'} if ($q->{'voltage_range'} ne "");
		$module{'low_power'} = "true" if ($q->{'low_power'} eq "true");
		$module{'output_g'} = "true" if ($q->{'output_g'} eq "true");
		$module{'range'} = $q->{'range'} if ($q->{'range'} ne "");
		$module{'device'} = $q->{'device'} if ($q->{'device'} ne "");
		$module{'serial_port'} = $q->{'serial_port'} if ($q->{'serial_port'} ne "");
		$module{'spi_port'} = $q->{'spi_port'} if ($q->{'spi_port'} ne "");
		$module{'spi_device'} = $q->{'spi_device'} if ($q->{'spi_device'} ne "");
		$module{'channel'} = $q->{'channel'} if ($q->{'channel'} ne "");
		$module{'max_voltage'} = $q->{'max_voltage'} if ($q->{'max_voltage'} ne "");
		$module{'differential'} = "true" if ($q->{'differential'} eq "true");
		$module{'temperature_compensation'} =  $q->{'temperature_compensation'} if ($q->{'temperature_compensation'} ne "");
		$module{'humidity_compensation'} =  $q->{'humidity_compensation'} if ($q->{'humidity_compensation'} ne "");
		$module{'auto_filter'} =  $q->{'auto_filter'} if ($q->{'auto_filter'} ne "");
		$module{'indoor'} =  $q->{'indoor'} if ($q->{'indoor'} ne "");
		$module{'mask_disturber'} =  $q->{'mask_disturber'} if ($q->{'mask_disturber'} ne "");
		$module{'lightning_threshold'} =  $q->{'lightning_threshold'} if ($q->{'lightning_threshold'} ne "");
		$module{'watchdog_threshold'} =  $q->{'watchdog_threshold'} if ($q->{'watchdog_threshold'} ne "");
		$module{'noise_level'} =  $q->{'noise_level'} if ($q->{'noise_level'} ne "");
		$module{'spike_rejection'} =  $q->{'spike_rejection'} if ($q->{'spike_rejection'} ne "");
		$module{'division_ratio'} =  $q->{'division_ratio'} if ($q->{'division_ratio'} ne "");
		$module{'tune_cap'} =  $q->{'tune_cap'} if ($q->{'tune_cap'} ne "");
		my @pins;
		push (@pins, 0) if $q->{'pin0'} eq "true";
		push (@pins, 1) if $q->{'pin1'} eq "true";
		push (@pins, 2) if $q->{'pin2'} eq "true";
		push (@pins, 3) if $q->{'pin3'} eq "true";
		$module{'pins'} = \@pins if scalar @pins > 0;
		# Save
		push @{$cfg->{'sensor_modules'}}, \%module;
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "deletesensormodule" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Delete existing  module
	my @searchresult = $jsonobj->find( $cfg->{'sensor_modules'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
	my $elemKey = $searchresult[0];
	splice @{ $cfg->{'sensor_modules'} }, $elemKey, 1 if (defined($elemKey));
	# Delete all digital outputs and inputs
	@searchresult = $jsonobj->find( $cfg->{'sensor_inputs'}, "\$_->{'module'} eq \"" . $q->{'name'} . "\"" );
	for my $elemKey (reverse sort @searchresult) {
		splice @{ $cfg->{'sensor_inputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	$jsonobj->write();
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "sensorinput" ) {

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
		my @searchresult = $jsonobj->find( $cfg->{'sensor_inputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
		#my $elemKey = $searchresult[0];
		if (scalar(@searchresult) > 0) {
			$error = "Name '" . $q->{'name'} . "' already exists. Names must be unique.";
		}
	}
	# Edit existing output
	if (!$error && $q->{'edit'}) {
		my @searchresult = $jsonobj->find( $cfg->{'sensor_inputs'}, "\$_->{'name'} eq \"" . $q->{'edit'} . "\"" );
		my $elemKey = $searchresult[0];
		splice @{ $cfg->{'sensor_inputs'} }, $elemKey, 1 if (defined($elemKey));
	}
	# Add new/edited output
	if (!$error) {
		# Required
		my %sensorinput = (
			name => $q->{'name'},
			module => $q->{'module'},
			retain => 'true',
			digits => '4'
		);
		# Optional
		$sensorinput{'type'} = $q->{'type'} if ($q->{'type'} ne "");
		$sensorinput{'pin'} = $q->{'pin'} if ($q->{'pin'} ne "");
		$sensorinput{'pin_trigger'} = $q->{'pin_trigger'} if ($q->{'pin_trigger'} ne "");
		$sensorinput{'pin_echo'} = $q->{'pin_echo'} if ($q->{'pin_echo'} ne "");
		$sensorinput{'burst'} = $q->{'burst'} if ($q->{'burst'} ne "");
		$sensorinput{'oversampling'} = $q->{'oversampling'} if ($q->{'oversampling'} ne "");
		$sensorinput{'interval'} = int($q->{'interval'}) if ($q->{'interval'} ne "");
		$sensorinput{'factor'} = $q->{'factor'} if ($q->{'factor'} ne "");

		# Save
		push @{$cfg->{'sensor_inputs'}}, \%sensorinput;
		$jsonobj->write();
	}
	$response = encode_json( $cfg );
	
}

if( $q->{action} eq "deletesensorinput" ) {

	# Check if all required parameters are defined
	if (!defined $q->{'name'} || $q->{'name'} eq "") {
		$error = "Name cannot be empty";
	}

	# Load config
	require LoxBerry::JSON;
	my $cfgfile = "$lbpconfigdir/mqttio.json";
	my $jsonobj = LoxBerry::JSON->new();
	my $cfg = $jsonobj->open(filename => $cfgfile);
	# Delete existing output
	my @searchresult = $jsonobj->find( $cfg->{'sensor_inputs'}, "\$_->{'name'} eq \"" . $q->{'name'} . "\"" );
	my $elemKey = $searchresult[0];
	splice @{ $cfg->{'sensor_inputs'} }, $elemKey, 1 if (defined($elemKey));
	$jsonobj->write();
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
