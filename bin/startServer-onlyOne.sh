#!/bin/bash
# usage startServer.sh <server_number> <port> <human_agent>
SERVER_DIR="server_onlyOne$1" 

./bin/startServer-base.sh $SERVER_DIR $2 &
sleep 45
cd "[temp]"/$SERVER_DIR

if [ $3 != "Alison" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Alison" "pass" "http://localhost:$2" 1>Alison.bot.log 2>&1 &
  echo "starting Alison quester bot..."
fi
if [ $3 != "Eldric" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Eldric" "pass" "http://localhost:$2" 1>Eldric.bot.log 2>&1 &
  echo "starting Eldric quester bot..."
fi
if [ $3 != "Florence" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Florence" "pass" "http://localhost:$2" 1>Florence.bot.log 2>&1 &
  echo "starting Florence quester bot..."
fi
if [ $3 != "Holden" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Holden" "pass" "http://localhost:$2" 1>Holden.bot.log 2>&1 &
  echo "starting Holden quester bot..."
fi
if [ $3 != "Knox" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Knox" "pass" "http://localhost:$2" 1>Knox.bot.log 2>&1 &
  echo "starting Knox quester bot..."
fi
if [ $3 != "Paige" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Paige" "pass" "http://localhost:$2" 1>Paige.bot.log 2>&1 &
  echo "starting Paige quester bot..."
fi
if [ $3 != "Tuesday" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Tuesday" "pass" "http://localhost:$2" 1>Tuesday.bot.log 2>&1 &
  echo "starting Tuesday quester bot..."
fi
if [ $3 != "Wilfred" ]
then
  npm run bot ./bots/mitch_bots/quester.ts "Wilfred" "pass" "http://localhost:$2" 1>Wilfred.bot.log 2>&1 &
  echo "starting Wilfred quester bot..."
fi


