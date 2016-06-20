;(function() {

	"use strict";

	var LIB = "Counter";

	window[LIB] = function() {
		this._template  = '<div class="counter"><span class="digit day char3">0</span><span class="digit day char2">0</span><span class="digit day char1 sep">0</span><span class="digit hrs char2">0</span><span class="digit hrs char1 sep dot">0</span><span class="digit min char2">0</span><span class="digit min char1 sep dot">0</span><span class="digit sec char2">0</span><span class="digit sec char1">0</span></div>';
		this._timestamp = new Date().getTime();
		this._events    = {};
		this._element   = null;
		this._digits    = null;
		this._interval  = null;
		this._calc      = {};

		this.init();

		return this;
	}

	window[LIB].prototype = {

		/**
		 * Calculate offset from now 'till this._timestamp
		 * and parse digits
		 *
		 * @return {Void}
		 */
		_recalc: function() {
			// date offset in seconds
			var offset        = new Date().getTime() - this._timestamp;
			this._calc        = {};
			this._calc.offset = offset;
			this._calc.offset = Math.round(offset / 1000);

			// convert seconds to days/hours/minutes/seconds
			offset            = Math.abs(this._calc.offset);
			this._calc.d      = Math.floor(offset / (24*60*60));
			offset           -= this._calc.d * (24*60*60);
			this._calc.h      = Math.floor(offset / (60*60));
			offset           -= this._calc.h * (60*60);
			this._calc.m      = Math.floor(offset / 60);
			offset           -= this._calc.m * 60;
			this._calc.s      = Math.floor(offset);
		},

		/**
		 * Set text for each this._digits
		 * (display counter)
		 *
		 * @return {Void}
		 */
		_render: function() {
			if ( ! this._digits) {
				return;
			}

			for (var i = 0; i < this._digits.length; i++) {
				var property, text, match;

				// is element days/hours/minutes/seconds digit
				match = this._digits[i].className.match(/(^|\s)(day|hrs|min|sec)(\s|$)/);
				if (match) {
					property = match[2].substr(0,1);
				}

				// element found?
				if (property) {
					// default display is numeric value
					text = this._calc[property].toString();

					// display speciffic character
					match = this._digits[i].className.match(/(^|\s)(char)([0-9]+)(\s|$)/);
					if (match) {
						var char = match[3]*1;
						text = char <= text.length ? text.substr(text.length - char, 1) : "0";
					}
				}

				// set element text
				if (typeof text !== "undefined" && this._digits[i].innerHTML !== text) {
					this._digits[i].innerHTML = text;
				}
			}
		},

		/**
		 * Tick event
		 * (calculate preview evety second)
		 *
		 * @return {Void}
		 */
		_tick: function() {
			this._recalc();

			// send event and prevent default
			if ( ! this.trigger("tick")) {
				return;
			}

			// check if not stopped in trigger event
			if ( ! this._interval) {
				return;
			}

			// preview
			this._render();
		},

		/**
		 * Constructor
		 *
		 * @return {Void}
		 */
		init: function() {
			this._recalc();
		},

		/**
		 * Destructor
		 *
		 * @return {Void}
		 */
		destroy: function() {
			// send event and prevent default
			if ( ! this.trigger("destroy")) {
				return;
			}

			// stop
			clearInterval(this._interval);

			// remove element
			this.detach();

			// clear properties
			this._element  = null;
			this._digits   = null;
			this._interval = null;
			this._calc     = {};
		},

		/**
		 * Append element to parent
		 *
		 * @return {Void}
		 */
		attach: function(parent) {
			this.detach();

			// convert parent to HTMLElement
			if (parent instanceof NodeList) {
				return this.attach(parent[0]);
			}
			else if (typeof parent === "string") {
				return this.attach(document.querySelectorAll(parent));
			}

			// create wrapper element
			var div = document.createElement("div");
			div.innerHTML = this._template;

			if (div.childNodes.length != 1) {
				throw LIB + " -> template error (wrap everything aroung one element)";
			}

			// remove from wrapper
			var el = div.childNodes[0];
			div.removeChild(div.childNodes[0]);

			// append on parent (if valid)
			if (parent instanceof HTMLElement) {
				parent.appendChild(el);
			}

			// set properties
			this._element = el;
			this._digits  = this._element.querySelectorAll(".digit");

			// preview
			this._recalc();
			this._render();
		},

		/**
		 * Remove element from parent
		 *
		 * @return {Void}
		 */
		detach: function() {
			if (this._element && this._element.parentNode) {
				this._element.parentNode.removeChild(this._element);
			}
		},

		/**
		 * Start counter
		 *
		 * @return {Void}
		 */
		start: function() {
			// counter already started
			if (this._interval) {
				return;
			}

			// recalculate
			this._recalc();

			// send event and prevent default
			if ( ! this.trigger("start")) {
				return;
			}

			// preview
			this._render();

			// start timer
			var that = this;
			this._interval = setInterval(function() {
				that._tick();
			}, 1000);
		},

		/**
		 * Stop counter
		 *
		 * @return {Void}
		 */
		stop: function() {
			// counter already stopped
			if ( ! this._interval) {
				return;
			}

			// recalculate
			this._recalc();

			// send event and prevent default
			if ( ! this.trigger("stop")) {
				return;
			}

			// stop timer
			clearInterval(this._interval);
			this._interval = null;
		},

		/**
		 * Start/stop counter
		 *
		 * @return {Void}
		 */
		toggle: function() {
			if (this._interval) {
				this.stop();
			}
			else {
				this.start();
			}
		},

		/**
		 * Trigger event
		 *
		 * @param  {String}  eventName
		 * @return {Boolean}
		 */
		trigger: function(eventName) {
			// create event-like object
			var result = {
				target           : this,
				type             : eventName,
				timeStamp        : new Date().getTime(),
				defaultPrevented : false
			}

			// execute callback
			if (this._events[eventName]) {
				for (var i = this._events[eventName].length - 1; i >= 0; i--) {
					if (this._events[eventName][i].call(this, result) === false) {
						result.defaultPrevented = true;
						break;
					}
				}
			}

			return ! result.defaultPrevented;
		},

		/**
		 * Bind event
		 *
		 * @param  {String}   eventName
		 * @param  {Function} callback
		 * @return {Void}
		 */
		on: function(eventName, callback) {
			// register event
			if ( ! this._events[eventName]) {
				this._events[eventName] = [];
			}

			// save callback
			this._events[eventName].push(callback);
		},

		/**
		 * Unbind event
		 *
		 * @param  {String}   eventName
		 * @param  {Function} callback
		 * @return {Void}
		 */
		off: function(eventName, callback) {
			// find event
			var result = [];
			for (var i = 0; i < this._events[eventName] ? this._events[eventName].length : 0; i++) {
				if (typeof callback === "undefined" || this._events[eventName][i] === callback) {
					result.push(i);
				}
			}

			// remove event
			for (var i = result.length - 1; i >= 0; i--) {
				this._events[eventName].splice(result[i], 1);
			}
		},

		/**
		 * Get calculated offset from now 'till this._timestamp
		 *
		 * @return {Numeric}
		 */
		offset: function() {
			return this._calc.offset;
		},

		/**
		 * Get/set timestamp
		 *
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		timestamp: function(val) {
			// get
			if (typeof val === "undefined") {
				return this._timestamp;
			}

			// set
			if (typeof (val*1) === "number") {
				this._timestamp = val*1;

				// display changes
				this._recalc();
				this._render();
			}
		},

		/**
		 * Get/set template
		 *
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		template: function(val) {
			// get
			if (typeof val === "undefined") {
				return this._template;
			}

			// set
			if (typeof val === "string") {
				this._template = val;

				// display changes
				this.attach(this._element ? this._element.parentNode : null);
			}
		}

	}

})();
