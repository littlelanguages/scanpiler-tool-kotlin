#!/bin/bash

.bin/build.sh

deno fmt --check

if [[ "$?" != "0" ]]
then
    exit -1
fi

(
    cd ./test
    ./gradlew test
)
