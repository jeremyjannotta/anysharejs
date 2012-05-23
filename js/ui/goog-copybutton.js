goog.provide('anyshare.ui.CopyButton');

goog.require('anyshare.flash.JSInterface');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component');

/**
 * @constructor
 */
anyshare.ui.CopyButton = function(baseUrl, swfobject, opt_domHelper) {
    goog.ui.Component.call(this, opt_domHelper);
    
    this.baseUrl_ = baseUrl || "";
    this.swfobject_ = swfobject || window['swfobject'];
    this.ready = false;
    
    this.buttonId_ = null;
    this.appId_ = null;
    this.copyButton_ = null;
    this.copyTextHandler_ = null;

    this.JSI = anyshare.flash.JSInterface;
    
    this.JSI.addCallback("onCopyButtonEvent", this.onCopyButtonEvent, this);
};

// Inheritance
goog.inherits(anyshare.ui.CopyButton, goog.ui.Component);

anyshare.ui.CopyButton.swfName = 'CopyButton';

/**
 * Creates an initial DOM representation for the component.
 */
anyshare.ui.CopyButton.prototype.createDom = function() {
    this.decorateInternal(this.dom_.createElement('div'));
};

anyshare.ui.CopyButton.prototype.decorateInternal = function(element) {
    // Build our UI
    this.element_ = element;   
};

anyshare.ui.CopyButton.prototype.log =function(msg) {
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
anyshare.ui.CopyButton.prototype.load = function(buttonId, containerId) {
    var appName = anyshare.ui.CopyButton.swfName;
    var appId = appName + "_" + buttonId;
    var placeholderId = buttonId + "_flash";
    
    var container = goog.dom.getElement(containerId);
    if (container && !goog.dom.getElement(placeholderId) && !goog.dom.getElement(appId)) {
        this.buttonId_ = buttonId;
    	this.appId_ = appId;
        
        var buttonFlash = goog.dom.createDom('div', {'id':placeholderId});
        goog.dom.appendChild(container, buttonFlash);

        var width = 0;
        var height = 0;
        
        var button = goog.dom.getElement(buttonId);
        if (button && button.offsetWidth > 0 && button.offsetHeight > 0) {
            width = button.offsetWidth;
            height = button.offsetHeight;
        } else {
            this.log("loadCopyButton: button missing or display:none");
        }
        
        var flashVars = { 
            "id" : buttonId,
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
	            "9.0", null, flashVars, flashParams, flashAttributes, goog.bind(this.onFlashEmbedComplete, this));
        }
    }
    
    this.setCopyButtonEnabled(buttonId, false);  
};


anyshare.ui.CopyButton.prototype.onCopyButtonReady = function(buttonId) {
    if (!this.ready && buttonId == this.buttonId_) {
        this.ready = true;
        this.copyButton_ = this.copyButton_ || goog.dom.getElement(this.appId_);
    
        // Additional callbacks for the flash object
        this.JSI.addCallback("getCopyText", this.getCopyText, this, this.JSI.returnType.CONCAT);
    }
};

anyshare.ui.CopyButton.prototype.onCopyButtonEvent = function(type, buttonId, copyText) {
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
	    
	    this.dispatchEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'buttonId':buttonId, 'copyText':copyText });
	}
};

anyshare.ui.CopyButton.prototype.onCopyButtonClicked = function(buttonId) {
    
};

anyshare.ui.CopyButton.prototype.onCopyButtonMouseOver = function(buttonId) {
	if (buttonId == this.buttonId_) {
	    var button = goog.dom.getElement(buttonId);
	    if (button) {
	        goog.dom.classes.add(button, "hover");
	        this.setCopyButtonEnabled(buttonId, false);
	    }
	}
};

anyshare.ui.CopyButton.prototype.onCopyButtonMouseOut = function(buttonId) {
	if (buttonId == this.buttonId_) {
	    var button = goog.dom.getElement(buttonId);
	    if (button) {
	        goog.dom.classes.remove(button, "hover");
	    }
	}
};

anyshare.ui.CopyButton.prototype.onCopyButtonTextCopied = function(buttonId, copyText) {
	if (buttonId == this.buttonId_) {
		this.setCopyButtonEnabled(buttonId, true);
	}
};

anyshare.ui.CopyButton.prototype.setCopyButtonEnabled = function(buttonId, enabled) {
	if (buttonId == this.buttonId_) {
	    var button = goog.dom.getElement(buttonId);
	    if (button) {
	    	goog.dom.classes.enable(button, "enabled", enabled);
	        var type = enabled ? "enabled" : "disabled";
	        
	    	this.dispatchEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'buttonId':buttonId, 'copyText':null });
	    }
	}
};

anyshare.ui.CopyButton.prototype.getCopyText = function(buttonId) {
    var text = '';
    
    if (buttonId == this.buttonId_) {
	    if (this.copyTextHandler_) {
	    	text = this.copyTextHandler_(buttonId);
	    }
    }
    
    return text;
};

anyshare.ui.CopyButton.prototype.setCopyText = function(text) {
	if (text && this.copyButton_) {
		this.JSI.callFlash(this.copyButton_, "setCopyText", text);
	}
};

anyshare.ui.CopyButton.prototype.setCopyTextHandler = function(func, context) {
	if (func && typeof func == "function") {
		context = context ? context : this;
		this.copyTextHandler_ = goog.bind(func, context);
	}
};

anyshare.ui.CopyButton.prototype.onFlashEmbedComplete = function(callbackObj) {
	var type = 'flashEmbedComplete';
	var success = callbackObj['success'] ? callbackObj['success'] : false;
	
	this.dispatchEvent({ 'type':'COPY_BUTTON_EVENT', 'eventType':type, 'success':success, 'buttonId':this.buttonId_, 'copyText':null });
};
