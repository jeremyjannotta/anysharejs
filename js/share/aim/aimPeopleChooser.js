goog.provide('com.aol.video.invite.AIMPeopleChooser');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.net.Jsonp');
goog.require('goog.Timer');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.ComboBoxItem');
goog.require('goog.ui.Component');

goog.require('com.aol.base');
goog.require('com.aol.lang.getString');


/**
 * @constructor
 */
com.aol.video.invite.AIMPeopleChooser = function(pageBaseUrl, apiBaseUrl, devId, authToken, opt_domHelper) {
    goog.ui.Component.call(this, opt_domHelper);
    
    this.pageBaseUrl_ = pageBaseUrl;
    this.apiBaseUrl_ = apiBaseUrl;
    this.devId_ = devId;
    this.authToken_ = authToken;
    this.enabled_ = true;
};

// Inheritance
goog.inherits(com.aol.video.invite.AIMPeopleChooser, goog.ui.Component);

/**
 * Static members
 */
com.aol.video.invite.AIMPeopleChooser.showOfflineUsers = false;
com.aol.video.invite.AIMPeopleChooser.showMobileUsers = false;
com.aol.video.invite.AIMPeopleChooser.showInteropUsers = false;
com.aol.video.invite.AIMPeopleChooser.showMobileForwardedUsers = false;
com.aol.video.invite.AIMPeopleChooser.showAimIdIfFriendly = false;

/**
 * Creates an initial DOM representation for the component.
 */
com.aol.video.invite.AIMPeopleChooser.prototype.createDom = function() {
    this.decorateInternal(this.dom_.createElement('div'));
};

com.aol.video.invite.AIMPeopleChooser.prototype.decorateInternal = function(element) {
    // Build our UI
    this.element_ = element;
    this.element_.className = "aimPeopleChooser";
    
    // Create a goog combobox
    this.combobox_ = new goog.ui.ComboBox();
    //this.combobox_.setUseDropdownArrow(true);
    this.combobox_.setDefaultText(com.aol.lang.getString("screens.aimPeopleChooser.comboDefault"));
    this.combobox_.setMatchFunction(goog.string.contains);
    this.combobox_.render(this.element_);

    this.label_ = this.dom_.createDom('span', 'chooserLabel hidden');
    this.label_.innerHTML = com.aol.lang.getString("screens.aimPeopleChooser.label");
    this.dom_.appendChild(this.element_, this.label_);
    
    /*
    var comboContentElement = this.combobox_.getContentElement();
    
    this.dom_.appendChild(this.element_, comboContentElement);
    */
};

/**
 * Called when component's element is known to be in the document.
 */
com.aol.video.invite.AIMPeopleChooser.prototype.enterDocument = function() {
    com.aol.video.invite.AIMPeopleChooser.superClass_.enterDocument.call(this);
    
    goog.events.listen(this.combobox_.labelInput_.element_, goog.events.EventType.KEYPRESS, this.onComboBoxInputKeyPress, false, this);
    goog.events.listen(this.combobox_.labelInput_.element_, goog.events.EventType.FOCUS, this.onComboBoxInputFocused, false, this);
    
    goog.events.listen(this.combobox_, goog.ui.Component.EventType.ACTION, this.onMenuSelected, false, this);
    
    /*
    //alert("Screen overlay enterDocument()");
    goog.events.listen(this.element_, goog.events.EventType.MOUSEOVER, this.onMouseOver, true, this);
    goog.events.listen(this.element_, goog.events.EventType.MOUSEOUT, this.onMouseOut, true, this);
    
    //this.addControlButtonHandlers(this.kickCancelButton_, this.onKickCancelButtonClick);
    //goog.events.listen(this.displayNameText_, goog.events.EventType.MOUSEOVER, this.onDisplayNameMouseOver, true, this);
     */
};


/**
 * Called when component's element is known to have been removed from the
 * document.
 */
com.aol.video.invite.AIMPeopleChooser.prototype.exitDocument = function() {
    com.aol.video.invite.AIMPeopleChooser.superClass_.exitDocument.call(this);
    
    goog.events.unlisten(this.combobox_.labelInput_.element_, goog.events.EventType.KEYPRESS, this.onComboBoxInputKeyPress, false, this);
    
    goog.events.unlisten(this.combobox_, goog.ui.Component.EventType.ACTION, this.onMenuSelected, false, this);
    
    /*
    //alert("Screen overlay exitDocument()");
    goog.events.unlisten(this.element_, goog.events.EventType.MOUSEOVER, this.onMouseOver, true, this);
    goog.events.unlisten(this.element_, goog.events.EventType.MOUSEOUT, this.onMouseOut, true, this);
    
    if (this.getKickable()) {
        this.removeControlButtonHandlers(this.kickButton_, this.onKickButtonClick);
    }
    //this.removeControlButtonHandlers(this.kickCancelButton_, this.onKickCancelButtonClick);
    //goog.events.unlisten(this.displayNameText_, goog.events.EventType.MOUSEOVER, this.onDisplayNameMouseOver, true, this);
     * 
     */
};

com.aol.video.invite.AIMPeopleChooser.prototype.disposeInternal = function() {
    com.aol.video.invite.AIMPeopleChooser.superClass_.disposeInternal.call(this);
    /*
    //alert("screen overlay dispose internal");
    delete this.peerId_;
    delete this.displayName_;
    
    this.clearMessages();    
    this.clearStamps();
    
    // Destroy our UI
    //if(this.element_) {
    //    goog.dom.removeNode(this.element_);
    //}
     * 
     */
};

com.aol.video.invite.AIMPeopleChooser.prototype.requestBuddyList = function() {
    
    var requestUrl = this.apiBaseUrl_ + "presence/get?a=" + encodeURIComponent(this.authToken_) + "&k=" + encodeURIComponent(this.devId_) + "&bl=1" + "&friendly=1" + "&f=json" + "&cacheDefeat="+(new Date().getTime());
    
    var jsonp = new goog.net.Jsonp(requestUrl, "c");
    jsonp.send(null, goog.bind(this.onGetBuddyListResponse, this), null, "aimPeopleChooserGetBuddyList");
};

com.aol.video.invite.AIMPeopleChooser.prototype.onGetBuddyListResponse = function(jsonData) {
    if(jsonData && jsonData['response'] && jsonData['response']['statusCode'] == 200) {
        this.blGroups_ = jsonData['response']['data']['groups'];
        this.createSearchList(this.blGroups_);
        this.createMenuItems();
    }
}

com.aol.video.invite.AIMPeopleChooser.prototype.createSearchList = function(groups) {
    if(typeof(groups) == 'undefined' || groups == null) {
        return;
    }
    this.uniqueBuddyMap_ = {};
    var numUniqueBuddies = 0;
    var numDupes = 0; // just curious :)
    for(var i=0; i<groups.length; i++) {
        var group = groups[i];
        if(group['smart'] == 2 || group['smart'] == 5 || group['smart'] == 6 || group['name'] == 'Locations') {
            continue;
        }
        var buddies = group['buddies'];
        for(var j=0; j<buddies.length; j++) {
            var buddy = buddies[j];
            if(buddy['userType'] == 'imserv' ||
               (!com.aol.video.invite.AIMPeopleChooser.showOfflineUsers && buddy['state'] == 'offline') ||
               (!com.aol.video.invite.AIMPeopleChooser.showMobileUsers && buddy['userType'] == 'sms') ||
               (!com.aol.video.invite.AIMPeopleChooser.showInteropUsers && buddy['userType'] == 'interop') ||
               (!com.aol.video.invite.AIMPeopleChooser.showMobileForwardedUsers && buddy['userType'] != 'sms' && buddy['state'] == 'mobile')) {
                continue;
            }
            if(typeof(this.uniqueBuddyMap_[buddy['aimId']]) == 'undefined') {
                // this is a unique buddy, so add it to the map
                this.uniqueBuddyMap_[buddy['aimId']] = buddy;
                numUniqueBuddies++;
            } else {
                numDupes++;
            }
        }
    }
    return numUniqueBuddies;
};

com.aol.video.invite.AIMPeopleChooser.prototype.getLabelForBuddy = function(buddyObjOrString, addAimIdSuffixIfFriendly) {
    var buddyLabel = "";
    
    var buddyObj = buddyObjOrString;
    if(typeof(buddyObjOrString) == 'string') {
        // look up in our 
        buddyObj = this.uniqueBuddyMap_[buddyObjOrString];
    }
    if(buddyObj) {
        var aimId = buddyObj['aimId'];
        buddyLabel = aimId;
        if(typeof(buddyObj['friendly']) != 'undefined') {
            buddyLabel = buddyObj['friendly'];
        } else if(typeof(buddyObj['displayId']) != 'undefined') {
            buddyLabel = buddyObj['displayId'];
        }
        if(addAimIdSuffixIfFriendly && buddyLabel != aimId && buddyObj['userType'] != 'interop' && aimId.indexOf("@facebook.aol") == -1) {
            buddyLabel += " ("+aimId+")";
        }
    }
    return buddyLabel;
};

com.aol.video.invite.AIMPeopleChooser.prototype.createMenuItems = function() {
    // Convert unique buddy map into a sorted list of combobox menu items
    this.combobox_.removeAllItems();
    
    var disabledItem = new goog.ui.ComboBoxItem(com.aol.lang.getString("screens.aimPeopleChooser.comboItem"), 'disabled');
    disabledItem.setEnabled(false);
    this.combobox_.addItem(disabledItem);
    
    var sortedBuddyList = this.getSortedBuddyList(this.uniqueBuddyMap_);
    
    for (var i=0; i < sortedBuddyList.length; i++) {
        var buddyObj = sortedBuddyList[i];
        // Build a menu-like UI for this buddy (icon + label)
        var displayEl = goog.dom.createDom('div', "av-aim-buddymenu-item");
        
        var iconEl = goog.dom.createDom('img', 'buddyIcon');
        iconEl.src = buddyObj['buddyIcon'] || this.pageBaseUrl_ + 'loadable/art/noBuddyIcon.png'; //'http://api.oscar.aol.com/expressions/get?f=redirect&t='+aimId+'&type=buddyIcon';
        this.dom_.appendChild(displayEl, iconEl);
        
        var buddyLabel = this.getLabelForBuddy(buddyObj, com.aol.video.invite.AIMPeopleChooser.showAimIdIfFriendly);
        var buddyTitle = this.getLabelForBuddy(buddyObj, true);
        
        var labelEl = goog.dom.createDom('span', 'label');
        labelEl.innerHTML = buddyLabel;
        this.dom_.appendChild(displayEl, labelEl);
        
        displayEl['title'] = buddyTitle;
        
        var aimId = buddyObj['aimId'];
        var item = new goog.ui.ComboBoxItem(displayEl, aimId);
        //item.setValue(buddyLabel);
        item.setFormatFromToken = null; // disable the auto-formatter for matched results, as it blows away our custom content o.O
        
        this.combobox_.addItem(item);
        
        // Cancel default mouseup event so can handle double-click separately
        //item.handleMouseUp = function(e) { return false; };
        
        //goog.events.listen(item.getElement(), goog.events.EventType.DBLCLICK, this.onComboBoxItemSelected, false, this);
        goog.events.listen(item, goog.ui.Component.EventType.ACTION, this.onComboBoxItemSelected, false, this);
    }
};

com.aol.video.invite.AIMPeopleChooser.prototype.getSortedBuddyList = function(map) {
    var buddyList = [];
    var i = 0; 
    for (var key in map) {
        buddyList[i++] = map[key];
    }
    
    goog.array.sort(buddyList, goog.bind(this.onSortBuddyList, this));
    
    return buddyList;
};

com.aol.video.invite.AIMPeopleChooser.prototype.onSortBuddyList = function(a, b) {
    /*
    var labelA = a['aimId'];
    if(typeof(a['friendly']) != 'undefined') {
        labelA = a['friendly'];
    } else if(typeof(a['displayId']) != 'undefined') {
        labelA = a['displayId'];
    }
    
    var labelB = b['aimId'];
    if(typeof(b['friendly']) != 'undefined') {
        labelB = b['friendly'];
    } else if(typeof(b['displayId']) != 'undefined') {
        labelB = b['displayId'];
    }
    */
    var labelA = this.getLabelForBuddy(a, false);
    var labelB = this.getLabelForBuddy(b, false);
    return goog.string.caseInsensitiveCompare(labelA, labelB);
};

com.aol.video.invite.AIMPeopleChooser.prototype.onComboBoxInputKeyPress = function(event) {
    if(event.keyCode == goog.events.KeyCodes.ENTER) {
        var text = this.combobox_.getValue();
        this.selectBuddy(text);
    }
};

com.aol.video.invite.AIMPeopleChooser.prototype.onComboBoxInputFocused = function(event) {
    /**
     * Google combobox has a bug where if you have text typed in the input, but you 
     * unfocus it and refocus, it shows ALL results instead of the filtered results.
     * 
     * Calling an internal combobox function, hopefully to force it to filter
     */
     if(typeof(this.combobox_.handleInputChange_) != 'undefined') {
        this.combobox_.handleInputChange_();
     } else if(typeof(this.combobox_.onInputChange_) != 'undefined') {
         this.combobox_.onInputChange_();
     }
};

com.aol.video.invite.AIMPeopleChooser.prototype.onComboBoxItemSelected = function(event) {
    var curItem = this.combobox_.getMenu().getHighlighted();
    if (curItem) {
        var id = curItem.getValue();
        this.selectBuddy(id);
    }
};

/**
 * Respond to the ACTION event of the combobox's Menu object
 */
com.aol.video.invite.AIMPeopleChooser.prototype.onMenuSelected = function(e) {
    // Cancel the original event to prevent it's default behavior
    return false;
};

com.aol.video.invite.AIMPeopleChooser.prototype.selectBuddy = function(aimId) {
    if (aimId && aimId != "") {
        var buddy = this.uniqueBuddyMap_[aimId];
        if(typeof(buddy) == 'undefined' || buddy == null) {
            buddy = { 'aimId' : aimId };
            this.combobox_.setItemVisibilityFromToken_(''); // Needed to reset the visibility filtering
        }
        this.dispatchEvent({ type : "BUDDY_SELECTED", 'buddy' : buddy });
        // Clear the input
        this.clearInput();
        this.combobox_.dismiss();
        if (goog.userAgent.GECKO && goog.userAgent.MAC) {
        	goog.Timer.callOnce(this.requestFocus, 750, this);
        }
    }
};

com.aol.video.invite.AIMPeopleChooser.prototype.requestFocus = function() {
    this.combobox_.labelInput_.element_.focus();
};


com.aol.video.invite.AIMPeopleChooser.prototype.clearInput = function() {
    this.combobox_.setValue('');
};

com.aol.video.invite.AIMPeopleChooser.prototype.clearBuddyList = function() {
    this.uniqueBuddyMap_ = {};
    this.combobox_.removeAllItems();
    this.blGroups_ = null;
};

com.aol.video.invite.AIMPeopleChooser.prototype.setEnabled = function(enabled) {
    this.enabled_ = enabled;
    this.combobox_.setEnabled(enabled);
};

com.aol.video.invite.AIMPeopleChooser.prototype.setMenuScrollPos = function(x, y) {
    var menuEl = this.combobox_.getMenu().getElement();
    menuEl.scrollLeft = x || 0;
    menuEl.scrollTop = y || 0;
};

com.aol.video.invite.AIMPeopleChooser.prototype.setDevId = function(devId) {
    this.devId_ = devId;
};

com.aol.video.invite.AIMPeopleChooser.prototype.setAuthToken = function(authToken) {
    this.authToken_ = authToken;
};

com.aol.video.invite.AIMPeopleChooser.prototype.setActive = function(active) {
	this.setEnabled(active);
	goog.dom.classes.enable(this.combobox_.input_, "hidden", !active); // Hide input element when inactive
	goog.dom.classes.enable(this.label_, "hidden", active); // Show label when inactive
};