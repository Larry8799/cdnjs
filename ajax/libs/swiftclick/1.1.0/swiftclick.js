/*
 * @license MIT License (see license.txt)
 */
 
function SwiftClick (contextEl)
{
	// if SwiftClick has already been initialised on this element then return the instance that's already in the Dictionary.
	if (typeof SwiftClick.swiftDictionary[contextEl] !== "undefined") return SwiftClick.swiftDictionary[contextEl];

	// add this instance of SwiftClick to the dictionary using the contextEl as the key.
	SwiftClick.swiftDictionary[contextEl] = this;

	this.options =
	{
		elements: {a:"a", div:"div", span:"span", button:"button"},
		maxTouchDrift: 44
	};

	var _self							= this,
		_swiftContextEl					= contextEl,
		_swiftContextElOriginalClick	= _swiftContextEl.onclick,
		_currentSwiftEl					= "undefined",
		_currentlyTrackingTouch			= false,
		_touchStartPoint				= {x:0, y:0},
		_touchEnd						= "undefined",
		_shouldSynthesizeClickEvent		= true;


	// SwiftClick is only initialised if both touch and orientationchange are supported.
	if ("onorientationchange" in window && "ontouchstart" in window)
	{
		init ();
	}

	function init ()
	{
		// check if the swift el already has a click handler and if so hijack it so it get's fired after SwiftClick's, instead of beforehand.
		if (typeof _swiftContextElOriginalClick === "function")
		{
			_swiftContextEl.addEventListener ("click", hijackedSwiftElClickHandler, false);
			_swiftContextEl.onclick = null;
		}

		// add listeners.
		_swiftContextEl.addEventListener ("touchstart", touchStartHandler, false);
		_swiftContextEl.addEventListener ("touchend", touchEndHandler, false);
	}

	function hijackedSwiftElClickHandler (event)
	{
		_swiftContextElOriginalClick (event);
	}

	function touchStartHandler (event)
	{
		var nodeName = event.target.nodeName.toLowerCase (),
			touch = event.changedTouches[0];
		
		// store touchstart positions so we can check for changes later (within touchend handler).
		_touchStartPoint.x = touch.pageX;
		_touchStartPoint.y = touch.pageY;

		// don't synthesize an event if we are already tracking, or if the node is not an acceptable type (the type isn't in the dictionary).
		if (_currentlyTrackingTouch || typeof _self.options.elements[nodeName] === "undefined")
		{
			_shouldSynthesizeClickEvent = false;
			return true;
		}

		_currentlyTrackingTouch = true;
		_currentSwiftEl = event.target;
	}

	function touchEndHandler (event)
	{
		_touchEnd = event.changedTouches[0];

		// cancel touch if the node type is unacceptable (not in the dictionary), or if the touchpoint position has drifted significantly.
		if (!_shouldSynthesizeClickEvent ||
			Math.abs (_touchEnd.pageX - _touchStartPoint.x) > _self.options.maxTouchDrift ||
			Math.abs (_touchEnd.pageY - _touchStartPoint.y) > _self.options.maxTouchDrift)
		{
			// reset vars to default state before returning early, effectively cancelling the creation of a synthetic click event.
			_currentlyTrackingTouch = false;
			_shouldSynthesizeClickEvent = true;
			return true;
		}

		event.preventDefault ();
		_currentSwiftEl.focus (); // TODO : is this working correctly?
		synthesizeClickEvent ();

		_currentlyTrackingTouch = false;
	}

	function synthesizeClickEvent ()
	{
		// synthesize a click event.
		var clickEvent = document.createEvent ("MouseEvents");
		clickEvent.initMouseEvent ("click", true, true, window, 1, _touchEnd.screenX, _touchEnd.screenY, _touchEnd.clientX, _touchEnd.clientY, false, false, false, false, 0, null);
		
		_currentSwiftEl.dispatchEvent (clickEvent);
	}

	// add an array of node names (strings) for which swift clicks should be synthesized.
	_self.addNodeNamesToTrack = function (nodeNamesArray)
	{
		var i = 0,
			length = nodeNamesArray.length,
			currentNodeName;

		for (i; i < length; i++)
		{
			if (typeof nodeNamesArray[i] !== "string") throw new TypeError ("all values within the 'nodeNames' array must be of type 'string'");

			currentNodeName = nodeNamesArray[i].toLowerCase ();
			_self.options.elements[currentNodeName] = currentNodeName;
		}
	};

	_self.replaceNodeNamesToTrack = function (nodeNamesArray)
	{
		_self.options.elements = {};
		_self.addNodeNamesToTrack (nodeNamesArray);
	};
}

SwiftClick.swiftDictionary = {};

// use a basic implementation of the composition pattern in order to create new instances of SwiftClick.
SwiftClick.attach = function (contextEl)
{
	"use strict";

	// if SwiftClick has already been initialised on this element then return the instance that's already in the Dictionary.
	if (typeof SwiftClick.swiftDictionary[contextEl] !== "undefined") return SwiftClick.swiftDictionary[contextEl];

	return new SwiftClick (contextEl);
};


// check for AMD/Module support, otherwise define SwiftClick as a global variable.
if (typeof define !== "undefined" && define.amd)
{
	// AMD. Register as an anonymous module.
	define (function()
	{
		"use strict";
		return SwiftClick;
	});

}
else if (typeof module !== "undefined" && module.exports)
{
	module.exports = SwiftClick.attach;
	module.exports.SwiftClick = SwiftClick;
}
else
{
	window.SwiftClick = SwiftClick;
}