#!/usr/bin/env python3
import json
import sys
import yaml

sys.stdout.write( json.dumps( yaml.safe_load( sys.stdin ), indent=4, sort_keys=True ) )
