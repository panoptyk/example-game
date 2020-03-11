#!/bin/bash

mkdir -p "[temp]"

for i in `seq 6`
do
  # start 1 human v 7 bot servers
  if [ $i -lt 5 ]
  then
    echo onlyOne$i
  fi
  # start 4 human v 4 bot servers
  if [ $i -eq 5 ]
  then
    echo half$i
  fi
  # start 8 human v 0 bot servers
  if [ $i -eq 6 ]
  then
    echo human$i
  fi
  sleep 0.25
done
