#!/bin/bash
# usage panoptykBoot-start.sh <version>

mkdir -p "[temp]"

#for i in `seq 6`
#do
  # start 1 human v 7 bot servers
#  if [ $i -lt 5 ]
#  then
#    echo onlyOne$i
#  fi
  # start 4 human v 4 bot servers
#  if [ $i -eq 5 ]
#  then
#    echo half$i
#  fi
  # start 8 human v 0 bot servers
#  if [ $i -eq 6 ]
#  then
#    echo human$i
#  fi
#  sleep 0.25
#done

if [ $1 -eq 1 ]
then
  ./bin/startServer-onlyOne.sh 1 1791 "Alison"
  ./bin/startServer-onlyOne.sh 2 1792 "Eldric"
  ./bin/startServer-onlyOne.sh 3 1793 "Tuesday"
  ./bin/startServer-onlyOne.sh 4 1794 "Wilfred"
  ./bin/startServer-half.sh 5 1795 "B"
fi

if [ $1 -eq 2 ]
then
  ./bin/startServer-onlyOne.sh 1 1791 "Florence"
  ./bin/startServer-onlyOne.sh 2 1792 "Holden"
  ./bin/startServer-onlyOne.sh 3 1793 "Knox"
  ./bin/startServer-onlyOne.sh 4 1794 "Paige"
  ./bin/startServer-half.sh 5 1795 "A"
fi

if [ $1 -eq 3 ]
then
  ./bin/startServer-base.sh "server_all1" 1791
fi

