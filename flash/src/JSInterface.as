package
{
	import flash.external.ExternalInterface;

	/**
	 * Interface for interacting with the Javascript environment.
	 */
	public class JSInterface
	{
		protected static var _jsCallbackName:String 	= "_JSInterfaceCallback";
		
		protected static var _flashCallbackName:String 	= "callFlash";
		
		protected static var _callbacks:Object 			= {};
		
		protected static var _callbackAdded:Boolean 	= false;
        
        protected static var _numCallsIntoExternalInterface:Number = 0;
		
		/**
		 * Name of the JS function to pass all JS calls through, from Flash.
		 */
		public static function get jsCallbackName():String
		{
			return _jsCallbackName;
		}

		public static function set jsCallbackName(value:String):void
		{
			if (value != "")
			{
				_jsCallbackName = value;
			}
		}
		
		/**
		 * Name of the Flash method to pass all Flash calls through, from JS.
		 */
		public static function get flashCallbackName():String
		{
			return _flashCallbackName;
		}
		
		public static function set flashCallbackName(value:String):void
		{
			if (value != "" )
			{
				_flashCallbackName = value;
				setFlashCallback(_flashCallbackName);
			}
		}
		
		/**
		 * Sets the Flash callback method in the ExternalInterface
		 */
		protected static function setFlashCallback(name:String):void
		{
			if (name != "" && ExternalInterface.available)
			{
				ExternalInterface.addCallback(name, JSInterface.callFlash);
				_callbackAdded = true;
			}
		}
		
		/**
		 * Same as ExternalInterface.available
		 */
		public static function get available():Boolean
		{
			return ExternalInterface.available;
		}
						
		/**
		 * Registers a function name and closure to be called by the flash callback method
		 */
		public static function addCallback(functionName:String, closure:Function):void
		{
			_callbacks[functionName] = closure;
			
			if (!_callbackAdded)
			{
				setFlashCallback(_flashCallbackName);
			}
		}
		
		/**
		 * Remove a callback that was already registered by addCallback()
		 */ 
		public static function removeCallback(functionName:String):void
		{
			if (_callbacks[functionName])
			{
				_callbacks[functionName] = null;
				delete _callbacks[functionName];
			}
		}
		
		/**
		 * Execute a Flash callback that was already registered from addCallback(). 
		 * Acts as a proxy for all calls into Flash from JS.
		 * 
		 * @param functionName The name of the registered Flash function to call
		 * @param args 0 or more arguments passed from JS
		 */ 
		public static function callFlash(functionName:String, ... args):*
		{
			if (_callbacks[functionName])
			{
				var fn:Function = _callbacks[functionName];
				if (args.length > 0)
				{
                    /*
					return fn.apply(null, args);
                    */
                    // Unroll the args
                    if(args.length == 1)
                    {
                        return fn(args[0]);
                    }
                    else if(args.length == 2)
                    {
                        return fn(args[0], args[1]);
                    }
                    else if(args.length == 3)
                    {
                        return fn(args[0], args[1], args[2]);
                    }
                    else if(args.length == 4)
                    {
                        return fn(args[0], args[1], args[2], args[3]);
                    }
                    else if(args.length == 5)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4]);
                    }
                    else if(args.length == 6)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
                    }
                    else if(args.length == 7)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
                    }
                    else if(args.length == 8)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
                    }
                    else if(args.length == 9)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
                    }
                    else if(args.length == 10)
                    {
                        return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
                    }
                    else
                    {
                        trace("Didn't send more arguments to flash because there are too many args to unroll");
                        return null;
                    }
				}
				else
				{
					return fn();
				}
			}
		}
		
		/**
		 * Execute a Javascript function with 0 or more arguments, via a single 
		 * JS function as an intermediary. Acts as a wrapper for ExternalInterface.call().
		 * 
		 * If _functionName is empty, behaves just like ExternalInterface.call(fn, ...args), 
		 * else it passes call to _functionName, like ExternalInterface.call(_functionName, fn, ...args)
		 * 
		 * @param name The name of the JS function to call		 * 
		 */
		public static function call(name:String, ... args):*
		{
            var result:*;
			if (ExternalInterface.available)
			{
                _numCallsIntoExternalInterface++;
                //trace("callingHTML: numCallsIntoExternalInterface: "+_numCallsIntoExternalInterface+" ("+name+")");
				if (args.length > 0) 
				{
					var newArgs:Array = args.slice();
					if (_jsCallbackName != "")
					{
						newArgs.unshift(_jsCallbackName, name);
					}
					else
					{
						newArgs.unshift(name);
					}
					
                    /*
					return ExternalInterface.call.apply(null, newArgs);
                    */
                    // Unroll the args
                    if(newArgs.length == 1)
                    {
                        result = ExternalInterface.call(newArgs[0]);
                    }
                    else if(newArgs.length == 2)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1]);
                    }
                    else if(newArgs.length == 3)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2]);
                    }
                    else if(newArgs.length == 4)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3]);
                    }
                    else if(newArgs.length == 5)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4]);
                    }
                    else if(newArgs.length == 6)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4], newArgs[5]);
                    }
                    else if(newArgs.length == 7)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4], newArgs[5], newArgs[6]);
                    }
                    else if(newArgs.length == 8)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4], newArgs[5], newArgs[6], newArgs[7]);
                    }
                    else if(newArgs.length == 9)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4], newArgs[5], newArgs[6], newArgs[7], newArgs[8]);
                    }
                    else if(newArgs.length == 10)
                    {
                        result = ExternalInterface.call(newArgs[0], newArgs[1], newArgs[2], newArgs[3], newArgs[4], newArgs[5], newArgs[6], newArgs[7], newArgs[8], newArgs[9]);
                    }
                    else
                    {
                        trace("Didn't send more arguments to flash because there are too many args to unroll");
                        result = null;
                    }
				} 
				else 
				{
					if (_jsCallbackName != "")
					{
                        result = ExternalInterface.call(_jsCallbackName, name);
					}
					else
					{
                        result = ExternalInterface.call(name);
					}
				}
                _numCallsIntoExternalInterface--;
			}
            return result;
		}				
	
	
		public static function callDirect(name:String, ... args):*
		{
			if (ExternalInterface.available)
			{
				var fullName:String = "com.aol.Video." + name; 
				trace("calling direct to " + fullName);
				
				if(args.length == 0)
				{
					return ExternalInterface.call(fullName);
				}
				else if(args.length == 1)
				{
					return ExternalInterface.call(fullName, args[0]);
				}				
				else if(args.length == 2)
				{
					return ExternalInterface.call(fullName, args[0], args[1]);
				}
				else if(args.length == 3)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2]);
				}
				else if(args.length == 4)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3]);
				}
				else if(args.length == 5)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4]);
				}
				else if(args.length == 6)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4], args[5]);
				}
				else if(args.length == 7)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
				}
				else if(args.length == 8)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
				}
				else if(args.length == 9)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
				}
				else if(args.length == 10)
				{
					return ExternalInterface.call(fullName, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
				}
				else
				{
					trace("Didn't send more arguments to flash because there are too many args to unroll");
					return null;
				}				
			}			
		}

	}
}