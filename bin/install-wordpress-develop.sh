#!/bin/bash

set -e

cd "$(dirname "$0")/.."

source .dev-lib
source dev-lib/check-diff.sh

if [ -z "$WP_VERSION" ]; then
	WP_VERSION=trunk
fi

install_wp
