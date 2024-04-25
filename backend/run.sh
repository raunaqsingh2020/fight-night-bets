#!/bin/bash

# Start Python processes in the background using nohup
nohup python3 odds.py > /dev/null 2>&1 &
nohup python3 txns.py > /dev/null 2>&1 &