#!/bin/bash

# Load existing dates.json into a variable
if [[ -f "metadata.json" ]]; then
  json=$(<dates.json)
else
  json="{}"  # Start with an empty JSON if dates.json doesn't exist
fi

# Use jq to ensure json is formatted correctly
json=$(echo "$json" | jq '.')

# Get modified files in the current commit
modified_files=$(git diff --name-only HEAD~1 HEAD)

# Update dates for modified files only
for filename in $modified_files; do
  # Only proceed if file exists in repo and isn't hidden or in hidden folders
  if [[ -f "$filename" ]] && [[ ! "$filename" =~ ^\. ]] && [[ ! "$filename" =~ /\. ]]; then
    date=$(git log -1 --format="%aI" -- "$filename")
    # Update the JSON object with the new date for the modified file
    json=$(echo "$json" | jq --arg file "$filename" --arg date "$date" '.[$file] = $date')
  fi
done

# Save the updated JSON to metadata.json
echo "$json" > metadata.json
