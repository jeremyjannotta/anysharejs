/**
 * @fileoverview An interface for managing callbacks From Flash to Javascript. 
 * 
 * Helps separate JS object structure from Flash, and provide similar functionality to JS as 
 * ExternalInterface does to Flash.
 * 
 * Example usage:
 * $.fn.JSInterface.addCallback("textUpdated", this.onTextUpdated, this);
 * 
 * $.fn.JSInterface.addCallback("textUpdated", this.onTextUpdated, this, $.fn.JSInterface.returnType.CONCAT);
 * 
 * $.fn.JSInterface.callFlash(this.copyButton, "setCopyText", text);
 * 
 */

(function($) { 
	
	$.fn.JSInterface = {
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
			returnType = returnType || $.fn.JSInterface.returnType.FIRST;
			
			if (!$.fn.JSInterface.callbacks_[name]) {
				$.fn.JSInterface.callbacks_[name] = { 
					'func': [], 
					'returnType' : returnType 
				};
			} else {
				$.fn.JSInterface.callbacks_[name]['returnType'] = returnType;
			}
			
			$.fn.JSInterface.callbacks_[name]['func'].push($.proxy(closure, context));
		},

		/**
		 * Call Javascript function from Flash, that has already been registered by addCallback().
		 */
		call : function(name) {
			var callbacks = $.fn.JSInterface.callbacks_;
			
			if (callbacks.hasOwnProperty(name)) {
				var funcs = callbacks[name]['func'];
				var returnType = callbacks[name]['returnType'];
				var finalResult = (returnType == $.fn.JSInterface.returnType.CONCAT) ? '' : null;
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
						if (i==0 && returnType == $.fn.JSInterface.returnType.FIRST) {
							finalResult = result;
						} else if (i==(funcs.length-1) && returnType == $.fn.JSInterface.returnType.LAST) {
							finalResult = result;
						} else if (returnType == $.fn.JSInterface.returnType.CONCAT) {
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
				var flashCallbackName = $.fn.JSInterface.flashCallbackName;
				
				 // Flash callback had not been added to Flash instance, so try adding manually here				
				 if ((instance[flashCallbackName] == null) && typeof __flash__addCallback != "undefined" && __flash__addCallback != null) {
					try {
						if (typeof __flash__addCallback == "undefined")
						{
							$.fn.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed because __flash__addCallback does not exist");
							$.fn.JSInterface.catastrophe = true;				
						}
						else
						{
							__flash__addCallback(instance, flashCallbackName);
						}
						
					} catch (e) {
						$.fn.JSInterface.log("Adding flash callback '"+flashCallbackName+"' failed: "+e.message);
						$.fn.JSInterface.catastrophe = true;				
					}
				 }
				 
				 if (instance[flashCallbackName] != null) {
					var fn = instance[flashCallbackName];
					var args = Array.prototype.slice.call(callArguments, 1);
					try {
						//$.fn.JSInterface.log("Calling '"+flashCallbackName+"' from JS into Flash ("+name+")");				
						return fn.apply(instance, args);
						          
					} catch (e) {
						$.fn.JSInterface.log("Error calling Flash method '"+name+"': "+e.message);
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
		window[$.fn.JSInterface.jsCallbackName] = $.fn.JSInterface.call;
	} catch (e) {
		// TODO: catch exception
	}
 
})(jQuery);