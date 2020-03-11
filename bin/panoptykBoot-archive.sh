#!/bin/bash
NOW=$(date +"%m-%d-%Y_%H.%M")

cd "[temp]"
mkdir -p "archive"/$NOW

cp -r --parents server*/data archive/$NOW
cp --parents server*/log.txt archive/$NOW
