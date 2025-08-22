#!/bin/bash
export NEXT_PUBLIC_POSTHOG_KEY=""
export NEXT_PUBLIC_POSTHOG_HOST=""

# This script runs during building the sandbox template
# and makes sure the Next.js app is (1) running and (2) the `/` page is compiled
function ping_server() {
	counter=0
	response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
	while [[ ${response} -ne 200 ]]; do
	  let counter++
	  if  (( counter % 20 == 0 )); then
        echo "Waiting for server to start..."
        sleep 0.1
      fi

	  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
	done
}

ping_server &
cd /home/user

# helper function: read from stdin, group by timestamp, append to given file
log_group() {
  local logfile=$1
  local prev_ts=""
  while IFS= read -r line; do
    # get current timestamp (only to second precision here)
    ts=$(date +'%Y-%m-%dT%H:%M:%S%:z')
    if [[ "$ts" != "$prev_ts" ]]; then
      echo "=== $ts ===" >> "$logfile"
      prev_ts=$ts
    fi
    echo "$line" >> "$logfile"
  done
}

# run Next, piping stdout and stderr each into their own grouping filter
npx next --turbo \
  > >(log_group next.stdout.log) \
  2> >(log_group next.stderr.log)