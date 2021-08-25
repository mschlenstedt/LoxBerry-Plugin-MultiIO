#!/usr/bin/env python3
import json
import sys
import yaml

sys.stdout.write(yaml.dump(json.load(sys.stdin),sort_keys=False))
