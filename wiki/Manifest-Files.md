Manifest files are JSON files that FreeDOM uses to collect information about your app and the permissions it requires.  At the core level, a manifest file looks like this:

    {
      "name": "My First App",
      "description": "This app is awesome"
      "app": {
        "script": "myScript.js"
      }
    }

There are optional parameters that can be specified but this is the bare-bones manifest that every app needs.  A full list of possible options is listed below:

# Manifest Options
## name
(required) This specifies the name of the application to FreeDOM.

**Example:**

    "name": "Application Name"

## description
(required) A description of the application you are writing.

**Example:**

    "description": "This is my app"

## app
(required) This specifies the code for FreeDOM to run

**Example:**

    "app" {
      ...
    }

This option also requires the script sub-option described below.

### script
(required) The Javascript file to load into the web worker (this path needs to be relative to the Main UI)

**Example:**

    "script": "path/to/script.js"

## permissions
This specifies the permissions that the app requires.  Here, any required modules should be specified.  The example code below specifies an app that requires storage and identity permissions.

**Example:**

    "permissions": [
        "storage", "identity"
    ]

## dependencies
This specifies any dependent apps that need to be loaded in order for the app to work properly.  This allows for modularization of code.

**Example:**

    "dependencies": {
      "moduleName": "path/to/module.json"
    }

Notice that the dependencies point to the manifest file and not the script itself.