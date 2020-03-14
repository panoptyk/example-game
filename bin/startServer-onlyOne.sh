#!/bin/bash
# usage startServer.sh <server_number> <port> <human_agent>
SERVER_DIR="onlyOne$1" 

./bin/startServer-base.sh $SERVER_DIR $2 &
sleep 5
cd "[temp]"/$SERVER_DIR


