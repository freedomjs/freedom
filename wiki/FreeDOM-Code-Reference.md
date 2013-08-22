The freedom.js API should be seen as 3 separate APIs:

 * [Communicating with a freedom.js service](FreeDOM-Code-Reference#service-api)
 * [Communicating with a freedom.js module](FreeDOM-Code-Reference#module-api)
 * [Communication with the freedom.js runtime](FreeDOM-Code-Reference#freedomjs-runtime-api)

Communication with freedom.js services is at the heart of freedom.js. Service APIs are explicitly defined, and listed on this page. Implementation of such an API can take one of two forms: Implementing code that uses a freedom.js service, or implementing a _provider_ of a Service API.

Communication between freedom.js modules may also be accomplished without a defined Service API. These interactions are less defined, since the same programmer will typically control both sides of these boundaries, and can benefit from the afforded flexibility. This basic communication falls back to an API reminiscent of the HTML5 postMessage communication channel, allowing arbitrary messages to be passed between the two code modules.

Communication with the core is used to manage custom channels and data. For reasons of efficiency and containment, it may be preferable to provide direct communication channels between different code modules, or to transmit a pointer to data rather than the data itself.  The freedom.js API manages such interactions.

# Service API

## Identity

The identity API provides access to the User's identity, their friends, and their devices.

## Transport

The transport API provides an abstraction for communication between remote instances of freedom.js.

## Storage

The storage API provides an abstraction for storage and retrieval of data.

# Module API
## freedom.emit
This sends out a message to all FreeDOM Web Workers with the specified data.  Any [freedom.on] (#freedomon) calls with the same message will respond to this.

### Parameters
* `message`: String - A message to send out to web workers.
* `data`: Any data to send along with the message, note that this can not be a function otherwise an error will be thrown and the call canceled.

### Example Usage

    data = ["a", "new", "idea"];
    freedom.emit("combineWords", data);

## freedom.on
This listens for any FreeDOM messages sent out by [freedom.emit] (#freedomemit) calls.  Once a call is made with the same listen message, the attached function runs in response.

### Parameters
* `triggerMessage`: String - The message to listen for.
* `result`: A function taking in 0 or 1 argument to run in response.

### Example Usage

    freedom.on("combineWords", function(words) {
      // Do stuff
    });

## freedom.reflectEvents
This boolean property will determine the behavior of the FreeDOM object.  By default reflectEvents is is `true`, which means that handlers set by [freedom.on](#freedomon) will be triggered if they match your own calls to [freedom.emit](#freedomemit).  By setting reflectEvents to `false`, these handlers will only be triggered by matching events emitted by the remote module.

### Example Usage

    freedom.reflectEvents = false;
    freedom.on("message", function(m) { console.log(m); });
    freedom.emit("message", "example"); // Won't trigger a log message.

# freedom.js Runtime API

The freedom.js runtime allows developer code to interact with the freedom.js runtime.  This can be thought of at some level as an equivalent to a system call API.  The Runtime API has, roughly speaking, two parts.  The first is a set of core, unprivileged operations needed by many modules: the ability to create and bind custom channels between modules, the ability to dereference freedom.js owned data, and the ability to provide content to a user.  The second is a set of abstractions of browser APIs that allow code and providers to function.  These abstractions require explicit user permission to enable in modules.

## core

## core.view

## core.socket

## core.transport

## core.storage