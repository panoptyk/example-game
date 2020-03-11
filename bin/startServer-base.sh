#!/bin/bash
# usage startServer.sh <dir> <port> 
mkdir -p "[temp]"/$1
cp -r ./assets "[temp]"/$1/assets
cp -r ./bots "[temp]"/$1/bots
cp -r ./client "[temp]"/$1/client
cp -r ./data "[temp]"/$1/data
cp -r ./example_data "[temp]"/$1/example_data
cp -r ./scripts "[temp]"/$1/scripts
cp -r ./server "[temp]"/$1/server
cp -r ./templates "[temp]"/$1/templates
cp ./*.js* "[temp]"/$1/
cp ./loadScenario.sh "[temp]"/$1/loadScenario.sh
cd "[temp]"/$1
ln -s ../../node_modules node_modules
# time to set up server
sed -i "s/8080/$2/" panoptyk-settings.json
npm run load-scenario Boot

npm run server & 
sleep 1
npm run bot ./bots/mitch_bots/questGiver.ts "Craftsmen Guild Leader" & 
npm run bot ./bots/mitch_bots/questGiver.ts "Informants Guild Leader" &