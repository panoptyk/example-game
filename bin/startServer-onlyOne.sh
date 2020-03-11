#!/bin/bash
# usage startServer.sh <server_number> <port> <human_agent>
SERVER_DIR="onlyOne$1" 

./bin/startServer-base.sh $SERVER_DIR $2 &
sleep 0.25
cd "[temp]"/$SERVER_DIR


