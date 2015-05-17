define([ 'jquery', 'underscore', 'backbone' ], function($, _, Backbone) {

	var Woopwoop = function(el, config) {
		config = _.defaults(config || (config = {}), defaultConfig);
		var selectors = _.defaults(config.selectors, defaultConfig.selectors);
		this._stateClassNames = _.defaults(config.stateClassNames, defaultConfig.stateClassNames);
		this._formatters = _.defaults(config.formatters, defaultConfig.formatters);
		this.$el = $(el);
		this.el = this.$el.get(0);
		this.$p = this.$el.find(selectors['player']).first();
		this.p = this.$p.get(0);
		this._controls = this.$el.find(selectors['controls']);
	};

	var controlInits = {
		play: function(el, player) {
			el.click(function() {
				player.play();
			});
		},
		pause: function(el, player) {
			el.click(function() {
				player.pause();
			});
		},
		toggle: function(el, player) {
			el.click(function() {
				player[player.isPaused() ? 'play' : 'pause']();
			});
		},
		mute: function(el, player) {
			el.click(function() {
				player.mute(!player.isMuted());
			});
		}
	};

	var states = {
		loading: {
			removes: [ 'woopwoop-ready', 'woopwoop-metadata-ready' ],
			predicate: function(player) { return player.isLoading(); }
		},
		ready: {
			removes: [ 'loading' ],
			predicate: function(player) { return player.isReady(); }
		},
		metadataReady: {
			removes: [ 'loading' ],
			predicate: function(player) { return player.isMetadataReady(); }
		},
		playing: {
			removes: [ 'paused' ],
			predicate: function(player) { return player.isPlaying(); }
		},
		paused: {
			removes: [ 'playing' ],
			predicate: function(player) { return player.isLoading(); }
		},
		muted: {
			removes: [ 'unmuted' ],
			predicate: function(player) { return player.isMuted(); }
		},
		unmuted: {
			removes: [ 'muted' ],
			predicate: function(player) { return !player.isMuted(); }
		},
		ended: {
			removes: [ 'playing', 'paused' ],
			predicate: function(player) { return player.isEnded(); }
		}
	};

	var defaultConfig = {
		selectors: {
			player: '.woop-player',
			controls: '.woop-control'
		},

		stateClassNames: {
			loading: 'woop-loading',
			ready: 'woop-ready',
			metadataReady: 'woop-metadata-ready',
			playing: 'woop-playing',
			paused: 'woop-paused',
			muted: 'woop-muted',
			ended: 'woop-ended'
		}
	}

	var playerEvents = [
		'abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'encrypted', 'ended', 'error',
		'interruptbegin', 'interruptend', 'loadeddata', 'loadedmetadata', 'loadstart', 'mozaudioavailable',
		'onencrypted', 'pause', 'play', 'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled', 'suspend',
		'timeupdate', 'volumechange', 'waiting'
	];

	var changeEvents = [ 'change:time', 'change:duration', 'change:volume', 'change:buffer' ];

	_.extend(Woopwoop.prototype, Backbone.Events);

	Woopwoop.prototype.initialize = function() {
		this._proxyEvents();
		this._bindEvents();
		this._initControls();
	};

	Woopwoop.prototype._proxyEvents = function() {
		var self = this;
		this.$p.on(playerEvents.join(' '), function(e) {
			self.trigger([ 'player:' + e.type ], e);
		});
	};

	Woopwoop.prototype._bindEvents = function() {
		var self = this;

		this.$p
			.on('loadstart', function() { self._setState('loading'); })
			.on('canplay', function() { self._setState('ready'); })
			.on('loadedmetadata', function() { self._setState('metadataReady'); })
			.on('playing', function() { self._setState('playing'); })
			.on('pause', function() { self._setState('paused'); })
			.on('ended', function() { self._setState('ended'); })
			.on('timeupdate', function() { self.trigger('change:time'); })
			.on('durationchange', function() { self.trigger('change:duration'); })
			.on('volumechange', function() {
				self._setState(self.isMuted() ? 'muted' : 'unmuted');
				self.trigger('change:volume');
			})
			.on('progress', function() { self.trigger('change:buffer'); });
	};

	Woopwoop.prototype._setState = function(stateName) {
		var state = states[stateName];
		var adds = this._stateClassNames[stateName];
		var removes = _.map(state.removes, function(stateName) {
				return this._stateClassNames[stateName];
			}, this).join(' ');

		this.$el
			.addClass(adds)
			.removeClass(removes);

		this.trigger('state:' + stateName);
	};

	Woopwoop.prototype._initControls = function() {
		var self = this;

		this._controls.each(function() {
			var control = $(this);
			var role = control.attr('role');
			controlInits.hasOwnProperty(role) && controlInits[role](control, self);
		});

		_.each(states, function(state, stateName) {
			state.predicate(self) && self._setState(stateName);
		});

		_.each(changeEvents, _.bind(this.trigger, this));
	};

	Woopwoop.prototype.ready = function(callback) {
		if (this.isReady()) {
			callback.call(this);
		} else {
			this.on('state:ready', function() {
				callback.call(this);
			});
		}
	};

	Woopwoop.prototype.metadataReady = function(callback) {
		if (this.isMetadataReady()) {
			callback.call(this);
		} else {
			this.on('state:metadataReady', function() {
				callback.call(this);
			});
		}
	};

	Woopwoop.prototype.play = function() {
		this.ready(function() {
			this.p.play();
		});
	};

	Woopwoop.prototype.pause = function() {
		this.p.pause();
	};

	Woopwoop.prototype.isLoading = function() {
		return this.p.networkState === 2;
	};

	Woopwoop.prototype.isReady = function() {
		return this.p.readyState === 4;
	};

	Woopwoop.prototype.isMetadataReady = function() {
		return this.p.readyState === 2;
	};

	Woopwoop.prototype.isPlaying = function() {
		return this.isReady() && !this.isPaused() && !this.isEnded();
	};

	Woopwoop.prototype.isPaused = function() {
		return this.p.paused;
	};

	Woopwoop.prototype.isMuted = function() {
		return this.p.muted || this.volume() === 0;
	};

	Woopwoop.prototype.isEnded = function() {
		return this.p.ended;
	};

	Woopwoop.prototype.time = function(val) {
		if (!_.isUndefined(val)) {
			this.p.currentTime = (val < 0 ? 0 : (val > this.duration() ? this.duration() : val));
		}
		return this.p.currentTime;
	};

	Woopwoop.prototype.percent = function(val) {
		if (!_.isUndefined(val)) {
			this.time(val * this.duration());
		}
		return this.time() / this.duration();
	};

	Woopwoop.prototype.volume = function(val) {
		if (!_.isUndefined(val)) {
			this.p.volume = (val < 0 ? 0 : (val > 1 ? 1: val));
			val > 0 && this.mute(false);
		}
		return this.p.volume;
	};

	Woopwoop.prototype.mute = function(val) {
		this.p.muted = val;
	};

	Woopwoop.prototype.duration = function() {
		return this.p.duration;
	};

	Woopwoop.prototype.buffer = function() {
		var buffered = [];

		if (!_.isUndefined(this.p.buffered)) {
			for (var i = 0; i < this.p.buffered.length; i++) {
				var start = this.p.buffered.start(i);
				var end = this.p.buffered.end(i);
				var length = end - start;

				buffered.push({
					start: start,
					end: end,
					length: length,
					startPercent: start / this.duration(),
					endPercent: end / this.duration(),
					lengthPercent: length / this.duration(),
				});
			}
		}

		return buffered;
	};

	return Woopwoop;
});