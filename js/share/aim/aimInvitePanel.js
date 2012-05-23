goog.provide('com.aol.video.invite.AIMInvitePanel');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.Jsonp');
goog.require('goog.ui.Component');
goog.require('goog.ui.Textarea');
goog.require('goog.Timer');

goog.require('com.aol.video.invite.AIMPeopleChooser');

goog.require('com.aol.ui.SelectAllOnFocusHandler');

goog.require('com.aol.base');
goog.require('com.aol.lang.getString');



/**
 * @constructor
 */
com.aol.video.invite.AIMInvitePanel = function(pageBaseUrl, inviteUrl, userData, apiBaseUrl, devId, authToken, logger, opt_domHelper) {
    goog.ui.Component.call(this, opt_domHelper);
    
    this.pageBaseUrl_ = pageBaseUrl;
    this.inviteUrl_ = inviteUrl;
    this.userData_ = userData;
    this.apiBaseUrl_ = apiBaseUrl;
    this.devId_ = devId;
    this.authToken_ = authToken;
    this.log = logger ? logger : com.aol.base.log;
    
    this.buddiesToSendInvitesTo_ = [];
    this.userDisplayName_ = "";
    this.sendIMQueue_ = [];
    this.sendIMCount_ = 0;
    this.sendIMResult_ = null;
    this.sendIMResultsById_ = {};
    this.sendIMErrorData_ = null;
    
    this.selectAllHandler_ = new com.aol.ui.SelectAllOnFocusHandler();
};

// Inheritance
goog.inherits(com.aol.video.invite.AIMInvitePanel, goog.ui.Component);

com.aol.video.invite.AIMInvitePanel.loggedInAsTemplate = "<span class='inviteUIUserName' title='{username}'>{username}</span> (<a id='inviteUILogoutAIM' href='#' class='loggedInAsLink noop'>" + com.aol.lang.getString("screens.aimInvitePanel.loggedInAs") + "</a>)";

/**
 * Static members
 */
com.aol.video.invite.AIMInvitePanel.randomStaticMember = "static";

com.aol.video.invite.AIMInvitePanel.maxNumBuddiesToInvite = 3;

com.aol.video.invite.AIMInvitePanel.inviteSendResponseTemplates = {
    'offlineSingle' : '{name} '+ com.aol.lang.getString("screens.aimInvitePanel.inviteSendResponseTemplate1"),
    'offlineMultiple' : '{names} ' + com.aol.lang.getString("screens.aimInvitePanel.inviteSendResponseTemplate2"),
    'successSingle' : com.aol.lang.getString("screens.aimInvitePanel.inviteSendResponseTemplate3") + ' {name}!',
    'successMultiple' : com.aol.lang.getString("screens.aimInvitePanel.inviteSendResponseTemplate4") + ' {names}!'
};

com.aol.video.invite.AIMInvitePanel.inviteSendMixedSuccessAdjoiner = "<br/><br/>" + com.aol.lang.getString("screens.aimInvitePanel.inviteSendMixedSuccessAdjoiner");

/**
 * Creates an initial DOM representation for the component.
 */
com.aol.video.invite.AIMInvitePanel.prototype.createDom = function() {
    this.decorateInternal(this.dom_.createElement('div'));
};

com.aol.video.invite.AIMInvitePanel.prototype.decorateInternal = function(element) {
    // Build our UI
    this.element_ = element;
    this.element_.className = "aimInvitePanel";
    
    //<div id='aimInviteUI'><div id='aimPeopleChooser'></div><textarea id='aimInviteMessage'></textarea><button id='aimSendButton' class='butt buttSubmit'>Send invites</button</div>
    // You're logged in as ""
    this.loggedInAs_ = this.dom_.createDom('div', 'loggedInAs');
    this.dom_.appendChild(this.element_, this.loggedInAs_);
    this.updateUserData(false);
    
    //
    
    // Combobox Chooser thing
    this.peopleChooser_ = new com.aol.video.invite.AIMPeopleChooser(this.pageBaseUrl_, this.apiBaseUrl_, this.devId_, this.authToken_);
    this.peopleChooser_.render(this.element_);
    
    // List of buddies to invite
    this.inviteList_ = this.dom_.createDom('div', 'aimInviteList');
    this.dom_.appendChild(this.element_, this.inviteList_);
    
    // Invite message box
    this.inviteMessage_ = this.dom_.createDom('textarea', 'aimInviteMessage');
    this.inviteMessage_.value = this.getDefaultInviteMessage();
    this.dom_.appendChild(this.element_, this.inviteMessage_);
    
    // Invite button
    this.inviteButton_ = this.dom_.createDom('button', 'butt buttDisabled aimInviteButton', com.aol.lang.getString("screens.aimInvitePanel.inviteButton"));
    this.dom_.appendChild(this.element_, this.inviteButton_);
    
    // Response panel
    this.responsePanel_ = this.dom_.createDom('div', 'aimResponsePanel hidden');
    
    this.responseMessage_ = this.dom_.createDom('p', 'aimResponseMessage');
    this.dom_.appendChild(this.responsePanel_, this.responseMessage_);
    
    this.responseConfirmButton_ = this.dom_.createDom('button', 'butt buttSubmit aimDoneButton', com.aol.lang.getString("screens.aimInvitePanel.responseConfirmButton"));
    this.dom_.appendChild(this.responsePanel_, this.responseConfirmButton_);
    
    this.responseMoreButton_ = this.dom_.createDom('button', 'butt buttSubmit aimMoreButton', com.aol.lang.getString("screens.aimInvitePanel.responseMoreButton"));
    this.dom_.appendChild(this.responsePanel_, this.responseMoreButton_);
};

/**
 * Called when component's element is known to be in the document.
 */
com.aol.video.invite.AIMInvitePanel.prototype.enterDocument = function() {
    com.aol.video.invite.AIMInvitePanel.superClass_.enterDocument.call(this);

    goog.dom.insertSiblingAfter(this.responsePanel_, this.element_);
    
    this.registerLogoutLink();
    
    goog.events.listen(this.inviteButton_, goog.events.EventType.CLICK, this.onInviteButtonClicked, false, this);
    goog.events.listen(this.peopleChooser_, "BUDDY_SELECTED", this.onBuddySelected, false, this);
    goog.events.listen(this.responseConfirmButton_, goog.events.EventType.CLICK, this.onResponseConfirmButtonClicked, false, this);
    goog.events.listen(this.responseMoreButton_, goog.events.EventType.CLICK, this.onResponseMoreButtonClicked, false, this);
    
    this.selectAllHandler_.addElement(this.inviteMessage_); 
};


/**
 * Called when component's element is known to have been removed from the
 * document.
 */
com.aol.video.invite.AIMInvitePanel.prototype.exitDocument = function() {
    com.aol.video.invite.AIMInvitePanel.superClass_.exitDocument.call(this);
    
    this.unregisterLogoutLink();
    
    goog.events.unlisten(this.inviteButton_, goog.events.EventType.CLICK, this.onInviteButtonClicked, false, this);
    goog.events.unlisten(this.peopleChooser_, "BUDDY_SELECTED", this.onBuddySelected, false, this);
    goog.events.unlisten(this.responseConfirmButton_, goog.events.EventType.CLICK, this.onResponseConfirmButtonClicked, false, this);
    goog.events.unlisten(this.responseMoreButton_, goog.events.EventType.CLICK, this.onResponseMoreButtonClicked, false, this);
};

com.aol.video.invite.AIMInvitePanel.prototype.disposeInternal = function() {
    com.aol.video.invite.AIMInvitePanel.superClass_.disposeInternal.call(this);
};

//////////////
//////////////
//////////////
//////////////
com.aol.video.invite.AIMInvitePanel.prototype.onBuddySelected = function(event) {
    var buddyObj = event['buddy'];
    if(buddyObj) {
        var alreadyExists = false;
        for(var i=0; i<this.buddiesToSendInvitesTo_.length; i++) {
            if(this.buddiesToSendInvitesTo_[i]['aimId'] == buddyObj['aimId']) {
                alreadyExists = true;
                break;
            }
        }
        if(!alreadyExists) {
            this.buddiesToSendInvitesTo_.push(buddyObj);
            this.updateInviteList();
        }
    }
    this.inviteButton_.focus();
}

com.aol.video.invite.AIMInvitePanel.prototype.onInviteButtonClicked = function(event) {
    // If have buddies to IM, and currently not sending IMs
    if(this.buddiesToSendInvitesTo_.length > 0 && this.sendIMCount_ == 0 && this.sendIMResult_ == null) {
        
        goog.dom.classes.remove(this.inviteButton_, 'buttSubmit');
        goog.dom.classes.add(this.inviteButton_, 'buttDisabled');
        this.inviteButton_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.onInviteButton");
        
        var targetAimIds = [];
        for(var i=0; i<this.buddiesToSendInvitesTo_.length; i++) {
            targetAimIds.push(this.buddiesToSendInvitesTo_[i]['aimId']);
        }
        var message = this.inviteMessage_.value;
        
        // Check if the message has our invite url. If not, append it to the end
        if(!goog.string.contains(message, this.inviteUrl_)) {
            if(message == this.getDefaultInviteMessage()) {
                // this is totally the default, so let's make it even prettier by adding "at"
                message += " at:";
            }
            message += " "+this.inviteUrl_;
        }
        
        this.requestSendIM(targetAimIds, message);
        
        var eventReport = {
            'type' : 'REPORT_EVENT',
            'category' : 'INVITE',
            'action' : 'AIMInviteClick',
            'label' : 'numInvited',
            'value' : targetAimIds.length
        };
        this.dispatchEvent(eventReport);
        
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.getDefaultInviteMessage = function() {
    return com.aol.lang.getString("screens.aimInvitePanel.getDefaultInviteMessage");
};

com.aol.video.invite.AIMInvitePanel.prototype.registerLogoutLink = function(event) {
    this.unregisterLogoutLink();
    
    this.logoutLink_ = this.dom_.$('inviteUILogoutAIM');
    if(this.logoutLink_) {
        goog.events.listen(this.logoutLink_, goog.events.EventType.CLICK, this.onLogoutLinkClicked, false, this);
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.unregisterLogoutLink = function(event) {
    if(typeof(this.logoutLink_) != 'undefined') {
        goog.events.unlisten(this.logoutLink_, goog.events.EventType.CLICK, this.onLogoutLinkClicked, false, this);
        delete this.logoutLink_;
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.onLogoutLinkClicked = function(event) {
    // Prevent the hashmark from showing up in the url
    event.preventDefault();
    this.dispatchEvent({ type : "SWITCH_USER_REQUESTED" });
};

com.aol.video.invite.AIMInvitePanel.prototype.requestSendIM = function(targetAimIds, message) {
    this.sendIMQueue_ = [];
    this.sendIMCount_ = targetAimIds.length;
    this.sendIMResult_ = null;
    this.sendIMResultsById_ = {};
    this.sendIMErrorData_ = null;
    
    var requestUrlBase = this.apiBaseUrl_ + "im/sendIM?a=" + encodeURIComponent(this.authToken_) 
        + "&k=" + encodeURIComponent(this.devId_) 
        + "&f=json" 
        + "&cacheDefeat="+(new Date().getTime())
        + "&message="+encodeURIComponent(message); // Append message
    
    // Create separate requests for each recipient
    for (var i=0; i < targetAimIds.length; i++) {
        this.sendIMQueue_[i] = requestUrlBase + "&t="+targetAimIds[i] + "&r=" + targetAimIds[i]; // we pass in the aimid to the r param so we can tell whom it was for
        
        goog.Timer.callOnce(this.requestSendIMFromQueue, (i == 0 ? 0 : 500), this);
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.requestSendIMFromQueue = function() {
    var requestUrl = this.sendIMQueue_.shift();
    if (requestUrl) {
        this.log("SendIM: "+requestUrl);
        
        var jsonp = new goog.net.Jsonp(requestUrl, "c");
        jsonp.send(null, goog.bind(this.onSendIMResponse, this), goog.bind(this.onSendIMError, this));
        // , "aimInvitePanelSendIM" <-- we don't include this because if we do multiple requests with 
        // the same id, it can get cleaned up while another request is still there. Let Closure generate
        // a callback param value
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.updateContents = function() {
    this.peopleChooser_.requestBuddyList();
};

com.aol.video.invite.AIMInvitePanel.prototype.clearContents = function() {
    this.peopleChooser_.clearBuddyList();
    this.inviteMessage_.value = this.getDefaultInviteMessage();
};

com.aol.video.invite.AIMInvitePanel.prototype.updateUserData = function(updateLogoutLink) {
    if(this.userData_) {
        var userDataLoginId = this.userData_['loginId'];
        var userDataDisplayName = this.userData_['displayName'];
        
        
        var userDisplayName = userDataLoginId;
        if(typeof(userDataDisplayName) != 'undefined') {
            userDisplayName = userDataDisplayName;
            if(userDisplayName != userDataLoginId && userDataLoginId.indexOf('facebook.aol') < 0 && userDataLoginId.indexOf('chat.facebook.com') < 0) {
                userDisplayName = userDisplayName + " ("+userDataLoginId+")";
            }
        }
        
        this.loggedInAs_.innerHTML = com.aol.video.invite.AIMInvitePanel.loggedInAsTemplate.replace(/{username}/g, userDisplayName);
        
        com.aol.base.truncateElementText(goog.dom.getElementByClass("inviteUIUserName", this.loggedInAs_), 200);
        
        if(updateLogoutLink) {
            this.registerLogoutLink();
        }
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.setUserData = function(userData) {
    this.userData_ = userData;
    this.updateUserData(true);
};

com.aol.video.invite.AIMInvitePanel.prototype.setDevId = function(devId) {
    this.devId_ = devId;
    this.peopleChooser_.setDevId(devId);
};

com.aol.video.invite.AIMInvitePanel.prototype.setAuthToken = function(authToken) {
    this.authToken_ = authToken;
    this.peopleChooser_.setAuthToken(authToken);
};

com.aol.video.invite.AIMInvitePanel.prototype.updateInviteList = function() {
    this.inviteList_.innerHTML = "";

    var names = [];
    for(var i=0; i<this.buddiesToSendInvitesTo_.length; i++) {
        names.push(this.buddiesToSendInvitesTo_[i]['aimId']);
        this.addInvitedBuddy(this.buddiesToSendInvitesTo_[i], (i == 0));
    }
    
    // Update the submit button look
    if(names.length > 0) {
        goog.dom.classes.add(this.inviteButton_, 'buttSubmit');
        goog.dom.classes.remove(this.inviteButton_, 'buttDisabled');
    } else {
        goog.dom.classes.add(this.inviteButton_, 'buttDisabled');
        goog.dom.classes.remove(this.inviteButton_, 'buttSubmit');
    }
    
    // Enable/disable the people chooser based on num people you've added to the list
    var chooserEnabled = this.buddiesToSendInvitesTo_.length <= (com.aol.video.invite.AIMInvitePanel.maxNumBuddiesToInvite - 1);
    
    this.peopleChooser_.setActive(chooserEnabled);
};

com.aol.video.invite.AIMInvitePanel.prototype.addInvitedBuddy = function(buddyObj, isFirst) {

    var aimId = buddyObj['aimId'];
    // Build a menu-like UI for this buddy (icon + label)
    var displayEl = goog.dom.createDom('div', {'class':'av-aim-buddymenu-item', 'id':'buddy_'+encodeURIComponent(aimId)});
    goog.dom.classes.enable(displayEl, "first", isFirst);
    
    var iconEl = goog.dom.createDom('img', 'buddyIcon');
    iconEl.src = buddyObj['buddyIcon'] || './loadable/art/noBuddyIcon.png'; //'http://api.oscar.aol.com/expressions/get?f=redirect&t='+aimId+'&type=buddyIcon';
    this.dom_.appendChild(displayEl, iconEl);
    
    var buddyLabel = aimId;
    if(typeof(buddyObj['friendly']) != 'undefined') {
        buddyLabel = buddyObj['friendly'];
    } else if(typeof(buddyObj['displayId']) != 'undefined') {
        buddyLabel = buddyObj['displayId'];
    }
    if(buddyLabel != aimId && buddyObj['userType'] != 'interop' && aimId.indexOf("@facebook.aol") == -1) {
        buddyLabel += " ("+aimId+")";
    }
    var labelEl = goog.dom.createDom('span', 'label');
    labelEl.innerHTML = buddyLabel;
    this.dom_.appendChild(displayEl, labelEl);
    
    var removeButton = goog.dom.createDom('span', {'class':'removeButton', 'title':com.aol.lang.getString("screens.aimInvitePanel.removeButton")});
    this.dom_.appendChild(displayEl, removeButton);
    goog.events.listen(removeButton, goog.events.EventType.CLICK, this.onRemoveInvitedBuddyClicked, false, this);
    
    goog.dom.appendChild(this.inviteList_, displayEl);
};

com.aol.video.invite.AIMInvitePanel.prototype.onRemoveInvitedBuddyClicked = function(event) {
    var buddyItem = event.target.parentNode;
    if (buddyItem) {
        this.removeInvitedBuddy(buddyItem);
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.removeInvitedBuddy = function(buddyItem) {
    var aimId = decodeURIComponent( buddyItem.id.substring(6) ); // "buddy_aimId"
    
    var index = -1;
    for(var i=0; i < this.buddiesToSendInvitesTo_.length; i++) {
        if (this.buddiesToSendInvitesTo_[i]['aimId'] == aimId) {
            index = i;
            break;
        }
    }
    if (index >= 0) {
        this.buddiesToSendInvitesTo_.splice(index, 1);
    }
    
    this.updateInviteList();
};

com.aol.video.invite.AIMInvitePanel.prototype.onSendIMResponse = function(jsonData) {
    this.sendIMCount_--;
    var result = "INVITES_SEND_ERROR";
    var error = null;
    var resultObject = {
    }
    if(jsonData && jsonData['response']) {
        var statusCode = jsonData['response']['statusCode'];
        resultObject = {
            'aimId' : jsonData['response']['requestId'],
            'statusCode' : statusCode,
            'statusText' : jsonData['response']['statusText']
        }
        if(statusCode == 200) {
            resultObject['sent'] = true;
            if (this.sendIMResult_ != "INVITES_SEND_ERROR") {
                result = "INVITES_SENT";
            }
        } else {
            resultObject['sent'] = false;
            resultObject['reasonText'] = jsonData['response']['data']['subCode']['reason'];
            resultObject['reasonCode'] = jsonData['response']['data']['subCode']['error'];
            
            error = jsonData['response']['statusText']+" (statusCode="+statusCode+", subcode="+jsonData['response']['data']['subCode']['reason']+")";
            this.log("SendIM error: "+error);
        }
        this.sendIMResultsById_[resultObject['aimId']] = resultObject;
    } else {
        error = "Invalid response format";
        this.log("SendIM error: "+error);    
    }
    this.sendIMResult_ = result;
    this.sendIMErrorData_ = error;
    this.updateIfSendIMComplete();
};

com.aol.video.invite.AIMInvitePanel.prototype.onSendIMError = function(jsonData) {
    this.sendIMCount_--;
    this.sendIMResult_ = "INVITES_SEND_ERROR";
    this.sendIMErrorData_ = "HTTP error";
    
    this.log("SendIM error: "+this.sendIMErrorData_);
    
    this.updateIfSendIMComplete();
};

com.aol.video.invite.AIMInvitePanel.prototype.updateIfSendIMComplete = function() {
    if (this.sendIMCount_ == 0 && this.sendIMResult_) {
    	var result = null;
        if (this.sendIMResult_ == "INVITES_SENT") {
            this.cleanupUI();
            this.showSendIMResponse(true, this.sendIMResultsById_);
            
        	if (this.sendIMResultsById_) {
        		names = [];
        		for (var id in this.sendIMResultsById_) {
        			var resultObject = this.sendIMResultsById_[id];
        	        if (resultObject['sent'] == true) {
        	        	names.push(this.peopleChooser_.getLabelForBuddy(resultObject['aimId'], com.aol.video.invite.AIMPeopleChooser.showAimIdIfFriendly));
        	        }
        	    }
            	result = names;
        	}
        } else {
            goog.dom.classes.add(this.inviteButton_, 'buttSubmit');
            goog.dom.classes.remove(this.inviteButton_, 'buttDisabled');
            this.cleanupUI();
            this.showSendIMResponse(false, this.sendIMResultsById_);
        }
        this.inviteButton_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.inviteButton");
        
        this.dispatchEvent({ type : this.sendIMResult_, 'error' : this.sendIMErrorData_, 'result' : result });
        
        // Reset queue parameters
        this.sendIMQueue_ = [];
        this.sendIMResult_ = null;
        this.sendIMResultsById_ = {};
        this.sendIMErrorData_ = null;
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.cleanupUI = function() {
    this.peopleChooser_.clearInput();
    this.buddiesToSendInvitesTo_ = [];
    this.updateInviteList();
    this.hideSendIMResponse();
    
    this.peopleChooser_.setMenuScrollPos(0, 0);
};

com.aol.video.invite.AIMInvitePanel.prototype.showSendIMResponse = function(success, resultMap) {
    goog.dom.classes.remove(this.responsePanel_, "hidden");
    goog.dom.classes.add(this.element_, "hidden");
    
    var endOnSuccess = false;
    if (endOnSuccess && success) {
        this.responseMessage_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.responseMessage");
        this.responseMoreButton_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.responseMoreButton");
    } else {
        var recipientText = "";
        var failedNames = [];
        var succeededNames = [];
        var showAimIdsIfFriendly = com.aol.video.invite.AIMPeopleChooser.showAimIdIfFriendly;
        for(var resultObject in resultMap) {
            if(resultMap[resultObject]['sent'] == true) {
                succeededNames.push('<strong>'+this.peopleChooser_.getLabelForBuddy(resultMap[resultObject]['aimId'], showAimIdsIfFriendly)+'</strong>');
            } else {
                // Uh. oh. sigh. thanks WIM. We love you too.
                // Generate a friendly name list for the IM recipient(s) that failed.
                failedNames.push('<strong>'+this.peopleChooser_.getLabelForBuddy(resultMap[resultObject]['aimId'], showAimIdsIfFriendly)+'</strong>');
            }
        }
        
        // Chances are, at least one person was offline
        var numIMsAttempted = this.buddiesToSendInvitesTo_.length;
        /*
        if(numIMsAttempted == numResults) {
            // Every one of the requests failed (might just be one buddy)
        } else {
            // some succeeded, some failed. more complicated messaging
        }
        */
        var templates = com.aol.video.invite.AIMInvitePanel.inviteSendResponseTemplates;
        
        var responseHTML = "";
        if(succeededNames.length > 0) {
            var succeededNameText = com.aol.base.getPrettyStringFromList(succeededNames);
            if(succeededNames.length > 1) {
                responseHTML += templates['successMultiple'].replace('{names}', succeededNameText);
            } else {
                responseHTML += templates['successSingle'].replace('{name}', succeededNameText);
            }
            this.responseMoreButton_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.responseMoreButton");
        }
        
        if(failedNames.length > 0) {
            if(succeededNames.length > 0) {
                // we had mixed results, so add our text adjoiner
                responseHTML += com.aol.video.invite.AIMInvitePanel.inviteSendMixedSuccessAdjoiner;
            }
            
            var failedNameText = com.aol.base.getPrettyStringFromList(failedNames);
            if(failedNames.length > 1) {
                responseHTML += templates['offlineMultiple'].replace("{names}", failedNameText);
            } else {
                responseHTML += templates['offlineSingle'].replace("{name}", failedNameText);
            }
            this.responseMoreButton_.innerHTML = com.aol.lang.getString("screens.aimInvitePanel.responseMoreButton2");
        }
        this.responseMessage_.innerHTML = responseHTML;
        //this.responseMessage_.innerHTML = "There was a problem sending one or more IMs.";
        //this.responseMoreButton_.innerHTML = "Try other people";
    }
};

com.aol.video.invite.AIMInvitePanel.prototype.hideSendIMResponse = function() {
    goog.dom.classes.add(this.responsePanel_, "hidden");
    goog.dom.classes.remove(this.element_, "hidden");
};

com.aol.video.invite.AIMInvitePanel.prototype.onResponseConfirmButtonClicked = function(event) {
    this.hideSendIMResponse();
    this.dispatchEvent({ type : "INVITES_COMPLETE" });
};

com.aol.video.invite.AIMInvitePanel.prototype.onResponseMoreButtonClicked = function(event) {
    this.hideSendIMResponse();
};