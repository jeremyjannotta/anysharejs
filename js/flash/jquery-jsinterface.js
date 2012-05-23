/**
 * @fileoverview An interface for managing callbacks From Flash to Javascript. 
 * 
 * Helps separate JS object structure from Flash, and provide similar functionality to JS as 
 * ExternalInterface does to Flash.
 * 
 * Example usage:
 * $.JSInterface.addCallback("textUpdated", this.onTextUpdated, this);
 * 
 * $.JSInterface.addCallback("textUpdated", this.onTextUpdated, this, $.JSInterface.returnType.CONCAT);
 * 
 * $.JSInterface.callFlash(this.copyButton, "setCopyText", text);
 * 
 */

(function($) { 
	
	$.JSInterface = {
		callbacks_ : {},
		catastrophe : false,
		
		/**
		 * Types used to collect the callback result per name.
		 */
		returnType : {
			FIRST : 'first',
			LAST : 'last',
			CONCAT : 'concat'
		},

		/**
		 * The global reference to the callback function where the Flash object will find it
		 */
		jsCallbackName : "_JSInterfaceCallback",
		
		/**
		 * The Flash function to pass all calls to Flash.
		 */
		flashCallbackName : "callFlash",
		
		/**
		 * Add callback for Flash to execute Javascript functions. 
		 * Similar to Flash's ExternalInterface.addCallback(), but in reverse.
		 * Use returnType to control how the result is collected when there's multiple callbacks registered with the same name.
		 */
		addCallback : function(name, closure, context, returnType) {
			returnType = returnType || $.JSInterface.returnType.FIRST;
			
			if (!$.JSInterface.callbacks_[name]) {
				$.JSInterface.callbacks_[name] = { 
					'func': [], 
					'returnType' : returnType 
				};
			} else {
				$.JSInterface.callbacks_[name]['returnType'] = returnType;
			}
			
			$.JSInterface.callbacks_[name]['func'].push($.proxy(closure, context));
		},

		/**
		 * Call Javascript function from Flash, that has already been registered by addCallback().
		 */
		call : function(name) {
			var callbacks = $.JSInterface.callbacks_;
			
			if (callbacks.hasOwnProperty(name)) {
				var funcs = callbacks[name]['func'];
				var returnType = callbacks[name]['returnType'];
				var finalResult = (returnType == $.JSInterface.returnType.CONCAT) ? '' : null;
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
						if (i==0 && returnType == $.JSInterface.returnType.FIRST) {
							finalResult = result;
						} else if (i==(funcs.length-1) && returnType == $.JSInterface.returnType.LAST) {
							finalResult = result;
						} else if (returnType == $.JSInterface.returnType.CONCAT) {
							finalResult += (result==null ? '' : result);
						}
					}
				}
				return finalResult;
			}
		},

		/**
		 * Wrapper function to call a Flash function from JS, using the singular flashCallbackName as a proxy function.  
		 * Callback name must have already been registered in Flash via the AS method JSInterface.addCallback()
		 */
		callFlash : function(instances, name) {
			var callArguments = arguments;
			
			$(instances).each(function(){
				var instance = this;
				var flashCallbackName = $.JSInterface.flashCallbackName;
				
				 // Flash callback had not been added to Flash instance, so try adding manually here				
				 if ((instance[flashCallbackName] == null) && typeof __flash__addCallback != "undefined" && __flash__addCallback != null) {
					try {
						if (typeof __flash__addCallback == "undefined")
						{
							$.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed because __flash__addCallback does not exist");
							$.JSInterface.catastrophe = true;				
						}
						else
						{
							__flash__addCallback(instance, flashCallbackName);
						}
						
					} catch (e) {
						$.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed: "+e.message);
						$.JSInterface.catastrophe = true;				
					}
				 }
				 
				 if (instance[flashCallbackName] != null) {
					var fn = instance[flashCallbackName];
					var args = Array.prototype.slice.call(callArguments, 1);
					try {
						//$.JSInterface.log("Calling '"+flashCallbackName+"' from JS into Flash ("+name+")");				
						return fn.apply(instance, args);
						          
					} catch (e) {
						$.JSInterface.log("Error calling Flash method '"+name+"': "+e.message);
					}
				 }
			});
		},
		
		log : function(msg) {
			if (typeof console != "undefined" && console) {
				console.log(msg);
			}
		}
	};
	
	// Make global reference to JSInterface callback
	try {
		window[$.JSInterface.jsCallbackName] = $.JSInterface.call;
	} catch (e) {
		// TODO: catch exception
	}
 
})(jQuery);