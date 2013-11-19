## GLOBALS

SCRIPT_DIR=`dirname $BASH_SOURCE[0]`
TEST_APP="$SCRIPT_DIR/chromeTestRunner"
FREEDOM_ROOT_DIR="$SCRIPT_DIR/.."
TMPDIR="/tmp" # Sets the root dir used by mktmp

CHROME_BINARY="google-chrome" # Linux / Cygwin
if [[ "$OSTYPE" == "darwin"* ]]; then # Mac OS X
	CHROME_BINARY="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi


## COMMAND LINE FLAGS

# Default values
CLEAN_UP_TEMP_FILES=1

# Handle each flag
for FLAG in $@; do
	if [ $FLAG == "-h" ] || [ $FLAG == "--help" ]; then
		echo "Usage: bash runTests.sh [flags ...]"
		echo ""
		echo "FLAGS:"
		echo "	--no-cleanup	Prevents the script from cleaning up any temp files and instead prints their locations."
		exit 1
	fi

	# Prevent cleaning up temp files (for debugging failures)
	if [ $FLAG == "--no-cleanup" ]; then
		CLEAN_UP_TEMP_FILES=0
	fi
done


## BUILD CHROME APP DYNAMICALLY

# Set up a new profile for testing and prevent the "First Run" splash screen
TEMP_PROFILE=`mktemp -d -t "freedomChromeTestProfile"`
touch "$TEMP_PROFILE/First Run"

# Pull in freedom.js and othe dependancies that MUST be inside the app's dir
RUNTIME_INCLUDES="$TEST_APP/runtimeIncludes"
if [ -d "$RUNTIME_INCLUDES" ]; then
	rm -r "$RUNTIME_INCLUDES"
fi
mkdir "$RUNTIME_INCLUDES"
cat "$FREEDOM_ROOT_DIR"/{src/libs,src,src/proxy,providers,interface}/*.js > "$TEST_APP/runtimeIncludes/freedomSetup.js" # Defines the setup(...) function.
cp "$FREEDOM_ROOT_DIR/freedom.js" "$TEST_APP/runtimeIncludes/freedom.js"
cp -r "$FREEDOM_ROOT_DIR/spec/helper" "$TEST_APP/runtimeIncludes/"
cp -r "$FREEDOM_ROOT_DIR/node_modules/grunt-contrib-jasmine/vendor/jasmine-1.3.0" "$TEST_APP/runtimeIncludes/"

# Pull in all the tests to run
cat `find $FREEDOM_ROOT_DIR -iname "*spec.js"` > "$TEST_APP/runtimeIncludes/specs.js" # Cat all specs together into a giant spec

## RUN TESTS

# Run the tests (Opens a new chrome window and blocks until it closes)
echo "Starting Chrome..."
"$CHROME_BINARY" -user-data-dir="$TEMP_PROFILE" --load-and-launch-app="$TEST_APP" 2> /dev/null
echo "Chrome exited."
echo ""


## CLEANUP

# Cleanup or list temp files
if [ $CLEAN_UP_TEMP_FILES -eq 1 ]; then
	echo "Cleaning up..."
	rm -r "$RUNTIME_INCLUDES"
	rm -r "$TEMP_PROFILE"
else
	echo "Not cleaning up."
	echo "Temp files left at:"
	echo "	$RUNTIME_INCLUDES"
	echo "	$TEMP_PROFILE"
fi


echo "Done."