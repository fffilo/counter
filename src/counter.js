;(function() {

	var plugin = "Counter";

	window[plugin] = function(parent, options) {
		this._options  = this._clone(options);
		this._parent   = parent;
		this._element  = null;
		this._digits   = null;
		this._interval = null;
		this._calc     = {};

		this.init();

		return this;
	}

	window[plugin].prototype = {

		/**
		 * Counter default options
		 *
		 * @type {Object}
		 */
		_defaults: {
			template  : '<div class="counter"><span class="digit day char3">0</span><span class="digit day char2">0</span><span class="digit day char1 sep">0</span><span class="digit hrs char2">0</span><span class="digit hrs char1 sep dot">0</span><span class="digit min char2">0</span><span class="digit min char1 sep dot">0</span><span class="digit sec char2">0</span><span class="digit sec char1">0</span></div>',
			timestamp : new Date().getTime()
		},

		/**
		 * Clone object
		 * (used for options)
		 *
		 * @param  {Object} o
		 * @return {Object}
		 */
		_clone: function(o) {
			var result = Object(result);

			for (var i in o) {
				if (Object.prototype.hasOwnProperty.call(o, i)) {
					result[i] = o[i];
				}
			}

			return result;
		},

		/**
		 * Trigger event
		 * (event is dispatched on parent element)
		 *
		 * @param  {String} event
		 * @return {Object}
		 */
		_trigger: function(event) {
			event = "counter" + event;
			var result;

			// ie
			if (document.createEvent) {
				result = document.createEvent("CustomEvent");
				result.initCustomEvent(event, true, true, { plugin: this });
			}

			// modern browsers
			else {
				result = new CustomEvent(event, { bubbles: true, cancelable: true, detail: { plugin: this }});
			}

			// dispatch
			return this._parent.dispatchEvent(result);
		},

		/**
		 * Append element (template) to parent
		 *
		 * @return {Void}
		 */
		_attach: function() {
			this._detach();

			var div = document.createElement("div");
			div.innerHTML = this._options.template;

			if (div.childNodes.length != 1) {
				throw "Counter -> template error (wrap everything aroung one element)";
			}

			var el = div.childNodes[0];
			div.removeChild(div.childNodes[0]);
			this._parent.appendChild(el);

			this._element = el;
			this._digits  = this._element.querySelectorAll(".digit");
		},

		/**
		 * Remove element from parent
		 *
		 * @return {Void}
		 */
		_detach: function() {
			this.stop();

			if (this._element && this._element.parentNode) {
				this._element.parentNode.removeChild(this._element);
			}

			this._element  = null;
			this._digits   = null;
			this._interval = null;
			this._calc     = {};
		},

		/**
		 * Calculate offset from now 'till this._options.timestamp
		 * and parse digits
		 *
		 * @return {Void}
		 */
		_recalc: function() {
			// date offset in seconds
			var offset        = new Date().getTime() - this.option("timestamp");
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
				if (typeof text !== "undefined") {
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
			if ( ! this._trigger("tick", this._calc)) {
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
			// use _default if property not defined in options
			for (var i in this._defaults) {
				this._options[i] = i in this._options ? this._options[i] : this._defaults[i];
			}

			// validate options properties
			for (var i in this._options) {
				this.option(i, this._options[i]);
			}

			// preview
			this._attach();
			this._recalc();
			this._render();
		},

		/**
		 * Destructor
		 *
		 * @return {Void}
		 */
		destroy: function() {
			// send event and prevent default
			if ( ! this._trigger("destroy")) {
				return;
			}

			// remove element
			this._detach();
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
			if ( ! this._trigger("start")) {
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
			if ( ! this._trigger("stop")) {
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
		 * Reset counter (set all zero values)
		 *
		 * @return {Void}
		 */
		reset: function() {
			if ( ! this._trigger("reset")) {
				return;
			}

			for (var i = 0; i < this._digits.length; i++) {
				this._digits[i].innerHTML = "0";
			}
		},

		/**
		 * Offset from now 'till this._options.timestamp
		 *
		 * @return {Numeric}
		 */
		offset: function() {
			return this._calc.offset;
		},

		/**
		 * Get/set option property
		 *
		 * @param  {String} key
		 * @param  {Mixed}  value
		 * @return {Mixed}
		 */
		option: function(key, value) {
			// get
			if (typeof value === "undefined") {
				return this._options[key];
			}

			// invalid key
			if ( ! key in this._defaults) {
				return;
			}

			// fix invalid option type
			if (typeof this._defaults[key] !== typeof this._options[key]) {
				this._options[key] = this._defaults[key];
			}

			// set
			if (typeof this._defaults[key] === typeof value) {
				this._options[key] = value;
			}

			// display changes
			if (key == "template") this._attach();
			this._recalc();
			this._render();
		}
	}

})();
