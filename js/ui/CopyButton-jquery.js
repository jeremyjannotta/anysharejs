/**
 * CopyButton jQuery plugin
 * 
 * Usage:
 * var button = $(myButtonContainer).CopyButton({
 * 		baseUrl: './',
 * 		swfobject : null,
 * 		copyTextHandler: function(buttonId){ return text; },
 * 		copyEventHandler: function(event){},
 * 		container: $('#container') | 'container'
 * });
 * 
 * button.data('copyButton').setCopyText('foo');
 */
(function($) { 

	var CopyButton = function(element, options) {
		this.$el = $(element);
		options = options || {};
		
		this.baseUrl_ = options.baseUrl || "";
	    this.swfobject_ = options.swfobject || window['swfobject'];
	    this.copyTextHandler_ = options.copyTextHandler || null;
	    this.copyEventHandler_ = options.copyEventHandler || null;
	    this.container_ = options.container || null;
	    
	    this.ready = false;
	    this.buttonId_ = null;
	    this.appId_ = null;
	    this.copyButton_ = null;

	    this.JSI = $.fn.JSInterface;
	    
	    this.JSI.addCallback("onCopyButtonEvent", this.onCopyButtonEvent, this);
	    
	    var obj = this;
	    
	    $(document).ready(function(){
	    	obj.init();
	    });
	};
	
	CopyButton.swfName = 'CopyButton';
	
	CopyButton.count = 0;
	
	CopyButton.prototype.init = function() {
		CopyButton.count++;
		
		this.buttonId_ = this.$el.attr('id');
		if (!this.buttonId_) {
			this.buttonId_ = 'copyButton' + CopyButton.count;
			this.$el.attr('id', this.buttonId_);
		}
		
		if (this.container_) {
			if (typeof this.container_ == 'string') {
				this.container_ = $('#'+this.container_);
			} else {
				this.container_ = $(this.container_);
			}
		}
		
		this.load();
	};
	
	CopyButton.prototype.log = function(msg) {
		if (typeof console != "undefined" && console) {
			console.log(msg);
		}
	};

	/**
	 * Loads a transparent Flash button on top of a given DOM element.
	 * 
	 * @param buttonId {object} The button DOM element the Flash button will attach to
	 * @param containerId {object} The container element that is a parent to both the button and the Flash object
	 */
	CopyButton.prototype.load = function() {
	    var appName = CopyButton.swfName;
	    var appId = appName + "_" + this.buttonId_;
	    var placeholderId = this.buttonId_ + "_flash";
	    
	    if (this.container_ && this.container_.size() && !$('#'+placeholderId).size() && !$('#'+appId).size()) {
	    	this.appId_ = appId;
	        
	        var buttonFlash = $('<div id="'+placeholderId+'">');
	        this.container_.append(buttonFlash);

	        var width = 0;
	        var height = 0;
	        
	        if (this.$el && this.$el.innerWidth() > 0 && this.$el.innerHeight() > 0) {
	            width = this.$el.innerWidth();
	            height = this.$el.innerHeight();
	        } else {
	            this.log("loadCopyButton: button missing or display:none");
	        }
	        
	        var flashVars = { 
	            "id" : this.buttonId_,
	            "width" : width, 
	            "height" : height 
	        };
	        
	        // Make sure these are set as "string" key values, rather than dot property,
	        // to prevent closure compiler from
	        // mangling these property names
	        var flashParams = {};
	        flashParams["quality"] = "high";
	        flashParams["bgcolor"] = "#FFFFFF";
	        flashParams["allowscriptaccess"] = "always";
	        flashParams["allowfullscreen"] = "false";
	        flashParams["wmode"] = "transparent";
	        flashParams["base"] = this.baseUrl_;
	        flashParams["menu"] = "false";
	        flashParams["loop"] = "false";
	        
	        var flashAttributes = {
	            "id" : appId,
	            "name" : appId,
	            "align" : "middle",
	            "class" : "copyButtonFlashObject"
	        };
	        
	        if (this.swfobject_) {
		        this.swfobject_.embedSWF((this.baseUrl_ || "")+appName+".swf", placeholderId, width, height,
		            "9.0", null, flashVars, flashParams, flashAttributes, $.proxy(this.onFlashEmbedComplete, this));
	        }
	    }
	    
	    this.setCopyButtonEnabled(this.buttonId_, false);  
	};


	CopyButton.prototype.onCopyButtonReady = function(buttonId) {
	    if (!this.ready && buttonId == this.buttonId_) {
	        this.ready = true;
	        this.copyButton_ = this.copyButton_ || $('#'+this.appId_);
	    
	        // Additional callbacks for the flash object
	        this.JSI.addCallback("getCopyText", this.getCopyText, this, this.JSI.returnType.CONCAT);
	    }
	};

	CopyButton.prototype.onCopyButtonEvent = function(type, buttonId, copyText) {
		if (buttonId == this.buttonId_) {
		    this.log("onCopyButtonEvent: ["+buttonId+"] "+type+(type=="copied"?" '"+copyText+"'":""));
		    switch(type) {
		        case "ready":
		            this.onCopyButtonReady(buttonId);
		            break;
		        case "click":
		            this.onCopyButtonClicked(buttonId);
		            break;
		        case "copied":
		            this.onCopyButtonTextCopied(buttonId, copyText);
		            break;
		        case "mouseover":
		            this.onCopyButtonMouseOver(buttonId);
		            break;
		        case "mouseout":
		            this.onCopyButtonMouseOut(buttonId);
		            break;
		    }
		    
		    this.triggerEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'buttonId':buttonId, 'copyText':copyText });
		}
	};

	CopyButton.prototype.onCopyButtonClicked = function(buttonId) {
	    
	};

	CopyButton.prototype.onCopyButtonMouseOver = function(buttonId) {
		if (buttonId == this.buttonId_ && this.$el) {
			this.$el.addClass("hover");
	        this.setCopyButtonEnabled(buttonId, false);
		}
	};

	CopyButton.prototype.onCopyButtonMouseOut = function(buttonId) {
		if (buttonId == this.buttonId_ && this.$el) {
			this.$el.removeClass("hover");
		}
	};

	CopyButton.prototype.onCopyButtonTextCopied = function(buttonId, copyText) {
		if (buttonId == this.buttonId_) {
			this.setCopyButtonEnabled(buttonId, true);
		}
	};

	CopyButton.prototype.setCopyButtonEnabled = function(buttonId, enabled) {
		if (buttonId == this.buttonId_ && this.$el) {
			this.$el.toggleClass("enabled", enabled);
	        var type = enabled ? "enabled" : "disabled";
	        
	    	this.triggerEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'buttonId':buttonId, 'copyText':null });
		}
	};

	CopyButton.prototype.triggerEvent = function(event) {
		if (this.copyEventHandler_) {
			this.copyEventHandler_(event);
		}
	};
	
	CopyButton.prototype.getCopyText = function(buttonId) {
	    var text = '';
	    
	    if (buttonId == this.buttonId_) {
		    if (this.copyTextHandler_) {
		    	text = this.copyTextHandler_(buttonId);
		    }
	    }
	    
	    return text;
	};

	CopyButton.prototype.setCopyText = function(text) {
		if (text && this.copyButton_) {
			this.JSI.callFlash(this.copyButton_, "setCopyText", text);
		}
	};

	CopyButton.prototype.onFlashEmbedComplete = function(callbackObj) {
		var type = 'flashEmbedComplete';
		var success = callbackObj['success'] ? callbackObj['success'] : false;
		
		this.triggerEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'success':success, 'buttonId':this.buttonId_, 'copyText':null });
	};

	$.fn.CopyButton = function(options) {
		
		this.each(function(){
			var $this = $(this);
			
			if ($this.data('copyButton')) return;
			
		    $this.data('copyButton', new CopyButton(this, options));
		});
		
		return this;
	};
	
})(jQuery);
