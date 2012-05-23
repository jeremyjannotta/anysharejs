/**
 * @fileoverview An interface for managing callbacks From Flash to Javascript. 
 * 
 * Helps separate JS object structure from Flash, and provide similar functionality to JS as 
 * ExternalInterface does to Flash.
 */

goog.provide('com.aol.flash.JSInterface');


com.aol.flash.JSInterface.callbacks_ = {};
com.aol.flash.JSInterface.catastrophe = false;

/**
 * Types used to collect the callback result per name.
 */
com.aol.flash.JSInterface.returnType = {
	FIRST : 'first',
	LAST : 'last',
	CONCAT : 'concat'
};

/**
 * The global reference to the callback function where the Flash object will find it.
 */
com.aol.flash.JSInterface.jsCallbackName = "_JSInterfaceCallback";

/**
 * The Flash function to pass all calls to Flash.
 */
com.aol.flash.JSInterface.flashCallbackName = "callFlash";

/**
 * Add callback for Flash to execute Javascript functions. 
 * Similar to Flash's ExternalInterface.addCallback(), but in reverse.
 * Use returnType to control how the result is collected when there's multiple callbacks registered with the same name.
 */
com.aol.flash.JSInterface.addCallback = function(name, closure, context, returnType) {
	returnType = goog.isDefAndNotNull(returnType) ? returnType : com.aol.flash.JSInterface.returnType.FIRST;
	
	if (!com.aol.flash.JSInterface.callbacks_[name]) {
		com.aol.flash.JSInterface.callbacks_[name] = { 
			'func': [], 
			'returnType' : returnType 
		};
	} else {
		com.aol.flash.JSInterface.callbacks_[name]['returnType'] = returnType;
	}
	
	com.aol.flash.JSInterface.callbacks_[name]['func'].push(goog.bind(closure, context));
};

/**
 * Call Javascript function from Flash, that has already been registered by addCallback().
 */
com.aol.flash.JSInterface.call = function(name) {
	var callbacks = com.aol.flash.JSInterface.callbacks_;
	
	if (callbacks.hasOwnProperty(name)) {
		var funcs = callbacks[name]['func'];
		var returnType = callbacks[name]['returnType'];
		var finalResult = (returnType == com.aol.flash.JSInterface.returnType.CONCAT) ? '' : null;
		var i;
		for (i=0; i<funcs.length; i++) {
			var fn = funcs[i];
			if (typeof fn == "function") {
				var result = null;

				// Call the function
				if (arguments.length > 1) {
					var args = Array.prototype.slice.call(arguments, 1);				
					result = fn.apply(null, args);
				} else {
					result = fn();
				}

				// Collect the result based on the returnType 
				if (i==0 && returnType == com.aol.flash.JSInterface.returnType.FIRST) {
					finalResult = result;
				} else if (i==(funcs.length-1) && returnType == com.aol.flash.JSInterface.returnType.LAST) {
					finalResult = result;
				} else if (returnType == com.aol.flash.JSInterface.returnType.CONCAT) {
					finalResult += (result==null ? '' : result);
				}
			}
		}
		return finalResult;
	}
};

/**
 * Wrapper function to call a Flash function from JS, using the singular flashCallbackName as a proxy function.  
 * Callback name must have already been registered in Flash via the AS method JSInterface.addCallback()
 */
com.aol.flash.JSInterface.callFlash = function(instance, name) {
	if (instance) {
		var flashCallbackName = com.aol.flash.JSInterface.flashCallbackName;
		
		 // Flash callback had not been added to Flash instance, so try adding manually here				
		 if ((instance[flashCallbackName] == null) && goog.isDefAndNotNull(__flash__addCallback)) {
			try {
				if (typeof __flash__addCallback == "undefined")
				{
					com.aol.flash.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed because __flash__addCallback does not exist");
					com.aol.flash.JSInterface.catastrophe = true;				
				}
				else
				{
					__flash__addCallback(instance, flashCallbackName);
				}
				
			} catch (e) {
				com.aol.flash.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed: "+e.message);
				com.aol.flash.JSInterface.catastrophe = true;				
			}
		 }
		 
		 if (instance[flashCallbackName] != null) {
			var fn = instance[flashCallbackName];
			var args = Array.prototype.slice.call(arguments, 1);
			try {
				//com.aol.flash.JSInterface.log("Calling '"+flashCallbackName+"' from JS into Flash ("+name+")");				
				return fn.apply(instance, args);
				          
			} catch (e) {
				com.aol.flash.JSInterface.log("Error calling Flash method '"+name+"': "+e.message);
			}
		 }
	}
};

com.aol.flash.JSInterface.log = function(msg) {
	if (typeof console != "undefined" && console) {
		console.log(msg);
	}
};

// Make global reference to JSInterface callback
try {
	window[com.aol.flash.JSInterface.jsCallbackName] = com.aol.flash.JSInterface.call;
} catch (e) {
	// TODO: catch exception
}

/*
 * Export methods and properties used outside this file
 */

goog.exportSymbol('com.aol.flash.JSInterface', com.aol.flash.JSInterface);
goog.exportSymbol('com.aol.flash.JSInterface.call', com.aol.flash.JSInterface.call);
goog.exportSymbol('com.aol.flash.JSInterface.callFlash', com.aol.flash.JSInterface.callFlash);