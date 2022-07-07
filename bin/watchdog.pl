#!/usr/bin/perl

use LoxBerry::System;
use LoxBerry::IO;
use LoxBerry::Log;
use LoxBerry::JSON;
use Getopt::Long;
#use warnings;
#use strict;
use Data::Dumper;

# Version of this script
my $version = "0.9.0";

# Globals
my $error;
my $verbose;
my $action;

# Logging
my $log = LoxBerry::Log->new (  name => "watchdog",
	package => 'multiio',
	logdir => "$lbplogdir",
	addtime => 1,
);

# Commandline options
GetOptions ('verbose=s' => \$verbose,
            'action=s' => \$action);

# Verbose
if ($verbose) {
        $log->stdout(1);
        $log->loglevel(7);
}

LOGSTART "Starting Watchdog";

# Lock
my $status = LoxBerry::System::lock(lockfile => 'multiio-watchdog', wait => 120);
if ($status) {
	LOGCRIT "$status currently running - Quitting.";
	exit (1);
}

# Todo
if ( $action eq "start" ) {

	&start();

}

elsif ( $action eq "stop" ) {

	&stop();

}

elsif ( $action eq "restart" ) {

	&restart();

}

elsif ( $action eq "check" ) {

	&check();

}

else {

	LOGERR "No valid action specified. action=start|stop|restart|check is required. Exiting.";
	print "No valid action specified. action=start|stop|restart|check is required. Exiting.\n";
	exit(1);

}

exit (0);


#############################################################################
# Sub routines
#############################################################################

##
## Start
##
sub start
{

	$log->default;
	my $count = `pgrep -c -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	chomp ($count);
	$count--; # Perl itself runs pgrep with sh, which also match -f in pgrep
	if ($count > "0") {
		LOGCRIT "MQTT IO already running. Please stop it before starting again. Exiting.";
		exit (1);
	}

	# Change config on the fly and convert to yaml for mqtt-io
	system ("rm /dev/shm/mqttio.yaml > /dev/null 2>&1");
	system ("cp $lbpconfigdir/mqttio.json /dev/shm > /dev/null 2>&1");
	system ("chmod 600 /dev/shm/mqttio.json > /dev/null 2>&1");
	my $cfgfile ="/dev/shm/mqttio.json";
	my $jsonobjcfg = LoxBerry::JSON->new();
	my $cfg = $jsonobjcfg->open(filename => $cfgfile);
	if ( !%$cfg ) {
		LOGCRIT "Cannot open config file $cfgfile. Exiting.";
		exit (1);
	}
	
	# MQTT
	my $mqtt = LoxBerry::IO::mqtt_connectiondetails();
	$cfg->{'mqtt'}->{'host'} = $mqtt->{'brokerhost'};
	my $brokerport = $mqtt->{'brokerport'} + 0.1 - 0.1; # Convert to int
	$cfg->{'mqtt'}->{'port'} = $brokerport;
	$cfg->{'mqtt'}->{'user'} = $mqtt->{'brokeruser'} if ($mqtt->{'brokeruser'});
	$cfg->{'mqtt'}->{'password'} = $mqtt->{'brokerpass'} if ($mqtt->{'brokerpass'});
	
	# Logfile
	my $mqttiolog = LoxBerry::Log->new (  name => "MQTTIO",
		package => 'multiio',
		logdir => "$lbplogdir",
		addtime => 1,
	);
	if ($verbose) {
		$mqttiolog->loglevel(7);
	}
	my $logfile = $mqttiolog->filename();
	#my $logfile = $mqttiolog->close();
	$cfg->{'logging'}->{'handlers'}->{'file'}->{'filename'} = $logfile;
	
	# Loglevel
	my $loglevel = "INFO";
	$loglevel = "CRITICAL" if ($log->loglevel() <= 2);
	$loglevel = "ERROR" if ($log->loglevel() eq 3);
	$loglevel = "WARNING" if ($log->loglevel() eq 4 || $log->loglevel() eq 5);
	$loglevel = "DEBUG" if ($log->loglevel() eq 6 || $log->loglevel() eq 7);
	$cfg->{'logging'}->{'handlers'}->{'console'}->{'level'} = $loglevel;
	$cfg->{'logging'}->{'handlers'}->{'file'}->{'level'} = $loglevel;

	# Write temporary json config
	$jsonobjcfg->write();

	# Convert to YAML
	system ("cat /dev/shm/mqttio.json | $lbpbindir/helpers/json2yaml.py > /dev/shm/mqttio.yaml");
	system ("sed -i -e \"s#\\(.*:.*\\)'\\([[:alnum:]_-]*\\)'#\\1\\2#g\" /dev/shm/mqttio.yaml");
	system ("sed -i -e \"s#\\(.*:.*\\)ON#\\1'ON'#g\" /dev/shm/mqttio.yaml"); # ON/OFF are always strings
	system ("sed -i -e \"s#\\(.*:.*\\)OFF#\\1'OFF'#g\" /dev/shm/mqttio.yaml"); # ON/OFF are always strings
	system ("chmod 600 /dev/shm/mqttio.yaml > /dev/null 2>&1");
	unlink ("/dev/shm/mqttio.json");

	if (!-e "/dev/shm/mqttio.yaml") {
		LOGCRIT "Cannot create yaml config file /dev/shm/mqttio.yaml. Exiting.";
		exit (1);
	}

	LOGINF "Starting MQTT IO...";

	$mqttiolog->default;
	LOGSTART "Starting MQTT IO...";
	system ("python3 -m mqtt_io /dev/shm/mqttio.yaml >> $logfile 2>&1 &");
	sleep 2;

	my $count = `pgrep -c -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	chomp ($count);
	$count--; # Perl itself runs pgrep with sh, which also match -f in pgrep
	$log->default;
	if ($count eq "0") {
		LOGCRIT "Could not start MQTT IO. Error: $?";
		exit (1)
	} else {
		my $status = `pgrep -o -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
		chomp ($status);
		LOGOK "MQTT IO started successfully. Running PID: $status";
	}

	return (0);

}

sub stop
{

	$log->default;
	LOGINF "Stopping MQTT IO...";
	system ('pkill -f "python3 -m mqtt_io /dev/shm/mqttio.yaml" > /dev/null 2>&1');
	sleep 2;

	my $count = `pgrep -c -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	chomp ($count);
	$count--; # Perl `` itself runs pgrep with sh, which also match -f in pgrep
	if ($count eq "0") {
		LOGOK "MQTT IO stopped successfully.";
	} else {
		my $status = `pgrep -o -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
		chomp ($status);
		LOGCRIT "Could not stop MQTT IO. Running PID: $status";
		exit (1)
	}

	# Remove temporary config file
	if (-e "/dev/shm/mqttio.yaml") {
		unlink ("/dev/shm/mqttio.yaml");
	}

	return(0);

}

sub restart
{

	$log->default;
	LOGINF "Restarting MQTT IO...";
	&stop();
	sleep (2);
	&start();

	return(0);

}

sub check
{

	$log->default;
	LOGINF "Checking Status of MQTT IO...";
	
	# Creating tmp file with failed checks
	if (!-e "/dev/shm/multiio-watchdog-fails.dat") {
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "0");
	}

	my $count = `pgrep -c -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
	chomp ($count);
	$count--; # Perl `` itself runs pgrep with sh, which also match -f in pgrep
	if ($count eq "0") {
		LOGERR "MQTT IO seems not to be running.";
		my $fails = LoxBerry::System::read_file("/dev/shm/multiio-watchdog-fails.dat");
		chomp ($fails);
		$fails++;
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "$fails");
		if ($fails > 9) {
			LOGERR "Too many failures. Will stop watchdogging... Check your configuration and start service manually.";
		} else {
			&restart();
		}
	} else {
		my $status = `pgrep -o -f "python3 -m mqtt_io /dev/shm/mqttio.yaml"`;
		chomp ($status);
		LOGOK "MQTT IO is running. Fine. Running PID: $status";
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "0");
	}

	return(0);

}
