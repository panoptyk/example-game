#!/bin/bash

./bin/panoptykBoot-stop.sh
./bin/panoptykBoot-clean.sh
./bin/startServer-base-john.sh server_testing 8080 $1