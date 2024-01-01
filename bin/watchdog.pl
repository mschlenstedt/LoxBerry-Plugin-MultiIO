#!/usr/bin/perl

use LoxBerry::System;
use LoxBerry::IO;
use LoxBerry::Log;
use LoxBerry::JSON;
use Getopt::Long;
#use warnings;
#use strict;
#use Data::Dumper;

# Version of this script
my $version = "0.9.1";

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
my $status = LoxBerry::System::lock(lockfile => 'multiio-watchdog', wait => 900);
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

	LOGERR "No valid action specified. --action=start|stop|restart|check is required. Exiting.";
	print "No valid action specified. --action=start|stop|restart|check is required. Exiting.\n";
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

	if (-e  "$lbpconfigdir/bridge_stopped.cfg") {
		unlink("$lbpconfigdir/bridge_stopped.cfg");
	}

	$log->default;
	# Change config on the fly and convert to yaml for mqtt-io
	unlink("/dev/shm/mqttio.yaml");
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
	my $brokerport = $mqtt->{'brokerport'} + 1 - 1; # Convert to int
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
	$cfg->{'logging'}->{'loggers'}->{'mqtt_io'}->{'level'} = $loglevel;

	# Write temporary json config
	$jsonobjcfg->write();

	# Convert to YAML
	system ("cat /dev/shm/mqttio.json | $lbpbindir/helpers/json2yaml.py > /dev/shm/mqttio.yaml");
	system ("chmod 600 /dev/shm/mqttio.yaml > /dev/null 2>&1");
	system ("sed -i -e \"s#\\(.*:.*\\)'\\([[:alnum:]_-]*\\)'#\\1\\2#g\" /dev/shm/mqttio.yaml");
	system ("sed -i -e \"s#\\(.*:.*\\)ON#\\1'ON'#g\" /dev/shm/mqttio.yaml"); # ON/OFF are always strings
	system ("sed -i -e \"s#\\(.*:.*\\)OFF#\\1'OFF'#g\" /dev/shm/mqttio.yaml"); # ON/OFF are always strings
	unlink ("/dev/shm/mqttio.json");

	if (!-e "/dev/shm/mqttio.yaml") {
		LOGCRIT "Cannot create yaml config file /dev/shm/mqttio.yaml. Exiting.";
		exit (1);
	}

	LOGINF "Starting MQTT IO...";

	$mqttiolog->default;
	LOGSTART "Starting MQTT IO...";
	LOGINF "Starting MQTT IO...";
	system ("pkill -f 'python3 -m mqtt_io'");
	sleep 2;
	system ("python3 -m mqtt_io /dev/shm/mqttio.yaml >> $logfile 2>&1 &");
	sleep 2;
	$log->default;

	LOGOK "Done.";

	return (0);

}

sub stop
{

	$log->default;
	LOGINF "Stopping MQTT IO...";
	system ("pkill -f 'python3 -m mqtt_io'");

	# Remove temporary config file
	if (-e "/dev/shm/mqttio.yaml") {
		unlink ("/dev/shm/mqttio.yaml");
	}

	my $response = LoxBerry::System::write_file("$lbpconfigdir/bridge_stopped.cfg", "1");

	LOGOK "Done.";

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
	
	if (-e  "$lbpconfigdir/bridge_stopped.cfg") {
		LOGOK "MQTT IO was stopped manually. Nothing to do.";
		return(0);
	}

	# Creating tmp file with failed checks
	if (!-e "/dev/shm/multiio-watchdog-fails.dat") {
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "0");
	}

#	my ($exitcode, $output)  = execute ("pgrep -f 'python3 -m mqtt_io'");
	my $output = qx(pgrep -f mqtt_io);
	my $exitcode  = $? >> 8;
	if ($exitcode != 0) {
		LOGWARN "MQTT IO seems to be dead - Error $exitcode";
		my $fails = LoxBerry::System::read_file("/dev/shm/multiio-watchdog-fails.dat");
		chomp ($fails);
		$fails++;
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "$fails");
		if ($fails > 9) {
			LOGERR "Too many failures. Will stop watchdogging... Check your configuration and start MQTT IO manually.";
		} else {
			&restart();
		}
	} else {
		LOGOK "MQTT IO seems to be alive. Nothing to do.";
		my $response = LoxBerry::System::write_file("/dev/shm/multiio-watchdog-fails.dat", "0");
	}

	return(0);

}

##
## Always execute when Script ends
##
END {

	LOGEND "This is the end - My only friend, the end...";
	LoxBerry::System::unlock(lockfile => 'multiio-watchdog');

}
