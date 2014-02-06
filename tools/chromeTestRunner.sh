## GLOBALS

SCRIPT_DIR=`dirname $BASH_SOURCE[0]`
FREEDOM_ROOT_DIR="$SCRIPT_DIR/.."
TEMP_DIR="$SCRIPT_DIR/chromeTestRunner/temp" # Will contain the concatonated spec file and the Chrome User Profile

CHROME_BINARY="google-chrome" # Linux / Cygwin
if [[ "$OSTYPE" == "darwin"* ]]; then # Mac OS X
	CHROME_BINARY="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

## COMMAND LINE FLAGS

# Default values
CLEAN_UP_TEMP_FILES=1
SPEC_SCRIPTS=""

function printHelp(){
	echo "Usage: bash runTests.sh [flags ...] SPEC_FILE <SPEC_FILE ...>"
	echo "   or: bash runTests.sh [flags ...] --all"
	echo ""
	echo "FLAGS:"
	echo "	--no-cleanup	Prevents the script from cleaning up any temp files and instead prints their locations."
	echo "	--all			Runs all the spec files in /spec/ that match *Spec.js or anywhere that match *.spec.js"	
}

if [ $# -eq 0 ]; then
	printHelp
	exit 1
fi

# Handle each flag
for FLAG in $@; do
	if [ $FLAG == "-h" ] || [ $FLAG == "--help" ]; then
		printHelp
		exit 1

	# Prevent cleaning up temp files (for debugging failures)
	elif [ $FLAG == "--no-cleanup" ]; then
		CLEAN_UP_TEMP_FILES=0

	elif [ $FLAG == "--all" ]; then
		pushd "$FREEDOM_ROOT_DIR" > /dev/null
		# Files anywhere ending with .spec.js (new format)
		for FILE in `find . -name "*.spec.js"`
		do
			SPEC_SCRIPTS="$SPEC_SCRIPTS<script type=\"text/javascript\" src=\"$FILE\"></script>"
		done
		popd > /dev/null

	else
		SPEC_SCRIPTS="$SPEC_SCRIPTS<script type=\"text/javascript\" src=\"$FLAG\"></script>"
	fi
done



## TURN FREEDOM ROOT INTO A CHROME APP DYNAMICALLY

# Make a manifest and html file for the app
cp "$SCRIPT_DIR/chromeTestRunner/manifest.json" "$FREEDOM_ROOT_DIR/manifest.json"
cp "$SCRIPT_DIR/chromeTestRunner/window-preamble.html" "$FREEDOM_ROOT_DIR/window.html"
echo "$SPEC_SCRIPTS" >> "$FREEDOM_ROOT_DIR/window.html"
cat "$SCRIPT_DIR/chromeTestRunner/window-postamble.html" >> "$FREEDOM_ROOT_DIR/window.html"

# Clear previous temp files
rm -r "$TEMP_DIR/"*

# Set up a new profile for testing and prevent the "First Run" splash screen
TEMP_PROFILE="$TEMP_DIR/chromeUserProfile"
mkdir -p $TEMP_PROFILE
touch "$TEMP_PROFILE/First Run"

# Set up a folder for temporary includes (eg. the concatonated spec file)
TEMP_INCLUDES="$TEMP_DIR/includes"
mkdir "$TEMP_INCLUDES"

# Create a few dynamic files to support the test app
cat "$FREEDOM_ROOT_DIR"/{src,src/link,src/proxy,providers/core,providers/social/loopback,providers/social/websocket-server,providers/storage/shared,providers/storage/isolated,providers/transport/webrtc,interface}/*.js > "$TEMP_INCLUDES/freedomSetup.js" # Defines the setup(...) function.



## RUN TESTS

# Run the tests (Opens a new chrome window and blocks until it closes)
echo "Starting Chrome..."
"$CHROME_BINARY" -user-data-dir="$TEMP_PROFILE" --load-and-launch-app="$FREEDOM_ROOT_DIR" 2> /dev/null
echo "Chrome exited."
echo ""



## CLEANUP

# Cleanup or list temp files
if [ $CLEAN_UP_TEMP_FILES -eq 1 ]; then
	echo "Cleaning up..."
	rm -r "$TEMP_DIR/"*
	rm "$FREEDOM_ROOT_DIR/manifest.json"
	rm "$FREEDOM_ROOT_DIR/window.html"
else
	echo "Not cleaning up."
	echo "Temp files left at:"
	echo "	$TEMP_DIR/"
	echo "	$FREEDOM_ROOT_DIR/manifest.json"
	echo "	$FREEDOM_ROOT_DIR/window.html"
fi

echo "Done."
