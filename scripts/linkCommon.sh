#!/bin/bash


# Get the absolute path of the current script
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
WORKSPACE_DIR=$(dirname "$SCRIPT_DIR")
COMMON_DIR="$WORKSPACE_DIR/../RegolithCo-Common"

rm -fr "$WORKSPACE_DIR/node_modules/@regolithco/common"

ln -s "$COMMON_DIR" "$WORKSPACE_DIR/node_modules/@regolithco/common"