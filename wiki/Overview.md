This page will provide you with everything you need to get started with FreeDOM.

# Components

A FreeDOM Application can be modeled as three major components.  The FreeDOM web worker, the application web worker, and the main UI.

## FreeDOM Web Worker
This is the main process required for FreeDOM to run.  This is started by including the [compiled freedom.js](https://homes.cs.washington.edu/~wrs/freedom.js) file in your HTML code.  When loading your code, you need to specify a [manifest file] (/UWNetworksLab/freedom/wiki/Manifest-Files) indicating the location and information about your application code.  In the example code below, our manifest file is specified in `manifest.json`.

    <script type="text/javascript" src="freedom.js" data-manifest="manifest.json"></script>

## Application Web Worker
Once FreeDOM loads your application from the manifest file, it will be run in a separate browser process that waits and responds to requests from the Main UI.

## Main UI
This is where all your front end code goes.

# FreeDOM Apps in 5 Steps
1. Create a application script that will be loaded into the web worker.  This is just a normal Javascript file that you write.  Read about the [freedom.emit] (/UWNetworksLab/freedom/wiki/FreeDOM-Code-Reference#freedomemit) and [freedom.on] (/UWNetworksLab/freedom/wiki/FreeDOM-Code-Reference#freedomon) functions to learn how to communicate to and from your Main UI.
2. Write your [manifest file] (/UWNetworksLab/freedom/wiki/Manifest-Files)
3. Write your Main UI
4. Include FreeDOM as mentioned above.
5. Congratulations, you now have a FreeDOM Web App!  For a more detailed introduction to FreeDOM, see [My First App (Tutorial)] (/UWNetworksLab/freedom/wiki/0.-Getting-Started)