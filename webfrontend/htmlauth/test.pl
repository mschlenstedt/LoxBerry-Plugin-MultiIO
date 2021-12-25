use Data::Dumper;

        # Load config
        require LoxBerry::JSON;
	use LoxBerry::System;
        my $cfgfile = "$lbpconfigdir/mqttio.json";
        my $jsonobj = LoxBerry::JSON->new();
        my $cfg = $jsonobj->open(filename => $cfgfile);
	my $q->{'name'} = "Native Pi";
	my @searchresult = $jsonobj->find( $cfg->{gpio_modules}, "\$_->{name} eq \"" . $q->{name} . "\"" );
	my $elemKey = $searchresult[0];
	$jsonobj->dump(\@searchresult, "Result of Array search");
	
	
