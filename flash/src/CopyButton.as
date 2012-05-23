package {
	import JSInterface;
	
	import flash.display.LoaderInfo;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.system.System;
	
	/**
	 * Transparent button that sits on top of a DOM element, to copy given text to the clipboard. 
	 * Passes mouse events to Javascript so a DOM button can respond to interactivity. 
	 * 
	 * Adapted from the ZeroClipboard library at http://code.google.com/p/zeroclipboard/
	 */
	public class CopyButton extends Sprite
	{
		protected var _copyText:String      = "";
		
		protected var _isMouseOver:Boolean  = false;
		
		protected var _button:Sprite        = null;
		
		protected var _buttonId:String      = "";
		protected var _width:Number         = 0;
		protected var _height:Number        = 0;
		
		public function CopyButton():void
		{
			flash.system.Security.allowDomain("*");
			
			super();
			
			this.addEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
		}
		
		protected function onAddedToStage(event:Event):void
		{
			this.removeEventListener(Event.ADDED_TO_STAGE, onAddedToStage);
			this.stage.addEventListener(Event.RESIZE, onStageResized);
			
			this.stage.scaleMode = StageScaleMode.NO_SCALE;
			this.stage.align = StageAlign.TOP_LEFT;
			this.stage.stageFocusRect = false;
			
			var flashvars:Object = LoaderInfo( this.root.loaderInfo ).parameters;
			_width = flashvars && flashvars.width ? Math.floor(flashvars.width) : 0;
			_height = flashvars && flashvars.height ? Math.floor(flashvars.height) : 0;
			_buttonId = flashvars && flashvars.id ? flashvars.id : "";
			
			_button = new Sprite();
			_button.buttonMode = true;
			_button.useHandCursor = true;
			_button.alpha = 0.0;
			addChild(_button);
			
			onStageResized(null);
			
			_button.addEventListener(MouseEvent.CLICK, onCopyButtonEvent, false, 0, false);
			_button.addEventListener(MouseEvent.MOUSE_OVER, onCopyButtonEvent, false, 0, false);
			_button.addEventListener(MouseEvent.MOUSE_OUT, onCopyButtonEvent, false, 0, false);
			
			if (JSInterface.available)
			{
				JSInterface.addCallback("setCopyText", setCopyText);
				onCopyButtonEvent(new Event("ready"));
			}
		}
		
		protected function onStageResized(event:Event):void
		{
			if (_button)
			{
				_button.graphics.clear();
				_button.graphics.beginFill(0xCCFF00);
				_button.graphics.drawRect(0, 0, _width, _height);
				_button.graphics.endFill();
			}
		}
		
		protected function onCopyButtonClick(event:MouseEvent):void
		{
			_isMouseOver = true;
			
			if (JSInterface.available)
			{
				_copyText = JSInterface.call("getCopyText", _buttonId);
			}
			
			if (_copyText != null && _copyText != "")
			{
				copyTextToClipboard();
			}
		}
		
		protected function setCopyText(text:String=""):void
		{
			_copyText = text;
		}
		
		protected function copyTextToClipboard():void  
		{  
			if (_copyText != null && _copyText != "")
			{
				System.setClipboard(_copyText);
				trace('Copied "'+_copyText+'" to clipboard');
				
				onCopyButtonEvent(new Event("copied"));
			}
		}
		
		protected function onCopyButtonEvent(event:Event):void
		{
			var type:String = "";
			switch (event.type)
			{
				case MouseEvent.CLICK:
					type = "click";
					onCopyButtonClick(event as MouseEvent);
					break;
				case MouseEvent.MOUSE_OVER:
					type = "mouseover";
					break;
				case MouseEvent.MOUSE_OUT:
					type = "mouseout";
					break;
				default:
					type = event.type;
			}
			if (JSInterface.available)
			{
				JSInterface.call("onCopyButtonEvent", type, _buttonId, _copyText);
			}
		}
	}
}