define([ 'jquery', 'underscore', 'backbone', 'woopwoop', 'moment', 'mustache', 'text!templates/episode.html', 'jquery.mousedrag' ],
	function($, _, Backbone, Woopwoop, moment, Mustache, template) {

	var playerConfig = {
		selectors: {
			player: '.player__player',
			controls: '.player__control'
		},
		stateClassNames: {
			loading: 'player_loading',
			playing: 'player_playing',
			paused: 'player_paused',
			muted: 'player_muted'
		}
	};

	var offsetToPercent = function(el, coord) {
		return coord.offsetX / el.outerWidth();
	};

	var percentToCssPercent = function(percent) {
		return (percent * 100) + '%';
	};

	var percentToCssPx = function(el, percent) {
		return (el.outerWidth() * percent) + 'px';
	};

	var formatTime = function() {
		var episode = this.$el.data('$episode');
		if (!episode.data('isSeeking')) {
			setTime(episode, this.time(), this.percent());
		}
	};

	var setTime = function(el, time, percent) {
		var $timeline = el.data('$timeline');
		var setCurrentTime = el.data('setCurrentTimeThrottled');
		$timeline.css('width', percentToCssPercent(percent));
		setCurrentTime(el, time);
	};

	var setCurrentTime = function(el, time) {
		var $time = el.data('$time');
		$time.text(moment.utc(0).seconds(time).format('H:mm:ss'));
	};

	var formatDurataion = function() {
		setDuration(this.$el.data('$episode'), this.duration());
	};

	var setDuration = function(el, duration) {
		var $duration = el.data('$duration');
		$duration.text(moment.utc(0).seconds(duration).format('H:mm:ss'));
	};

	var formatVolume = function() {
		setVolume(this.$el.data('$episode'), this.volume());
	};

	var setVolume = function(el, volume) {
		var $volumeScale = el.data('$volumeScale');
		var $volume = el.data('$volume');
		$volume.css('width', percentToCssPx($volumeScale, volume));
	};

	var formatBuffer = function() {
		setBuffer(this.$el.data('$episode'), this.buffer());
	};

	var setBuffer = function(el, buffer) {
		var $shaft = el.data('$shaft');
		$shaft.find('.player__line_buffer').remove();

		for (var i = 0; i < buffer.length; i++) {
			var $bufferline = $('<div>')
				.addClass('player__line player__line_buffer')
				.css({
					'marginLeft': percentToCssPercent(buffer[i].startPercent),
					'width': percentToCssPercent(buffer[i].lengthPercent)
				})
				.appendTo($shaft);
		}
	};

	var templateFunctions = {
		formatDate: function() {
			return function(text, render) {
				return moment.utc(render(text)).format('MMMM Do');
			};
		},
		formatTimestamp: function() {
			return function(text, render) {
				return moment.utc(0).second(parseFloat(render(text))).format('H:mm:ss');
			};
		}
	};

	var EpisodeView = Backbone.View.extend({

		tagName: 'article',
		className: 'episode',

		initialize: function() {
			this.template = template;
  			Mustache.parse(this.template);

  			this.$el.data('setCurrentTimeThrottled', _.throttle(setCurrentTime, 100));
		},

		events: {
			'mousedrag .player__shaft': 'updateTime',
			'mousedrop .player__shaft': 'parseTime',
			'mousedrag .player__volume-scale': 'updateVolume',
			'mousedrop .player__volume-scale': 'parseVolume',
			'click .episode__playlist-button': 'togglePlaylist',
			'click .playlink__link': 'jumpToTime'
		},

		updateTime: function(e, coord) {
			this.$el.data('isSeeking', true);
			var player = this.$el.data('player');
			var percent = offsetToPercent($(e.currentTarget), coord);
			setTime(this.$el, player.duration() * percent, percent);
		},

		parseTime: function(e, coord) {
			var player = this.$el.data('player');
			player.percent(offsetToPercent($(e.currentTarget), coord));
			this.$el.data('isSeeking', false);
		},

		updateVolume: function(e, coord) {
			setVolume(this.$el, offsetToPercent($(e.currentTarget), coord));
		},

		parseVolume: function(e, coord) {
			var player = this.$el.data('player');
			player.volume(offsetToPercent($(e.currentTarget), coord));
		},

		togglePlaylist: function() {
			this.$el.data('$playlistButton').toggleClass('playlist-button_selected');
			this.$el.data('$playlist').slideToggle();
		},

		jumpToTime: function(e) {
			var player = this.$el.data('player');
			player.time($(e.currentTarget).data('timestamp'));
			player.play();
		},

		render: function() {
			var templateData = _.extend(this.model.attributes, templateFunctions);

			this.$el
				.html(Mustache.render(this.template, templateData))
				.data({
					$shaft: this.$('.player__shaft').mousedrag(),
					$timeline: this.$('.player__line_time'),
					$time: this.$('.player__time-current'),
					$duration: this.$('.player__duration'),
					$volumeScale: this.$('.player__volume-scale').mousedrag(),
					$volume: this.$('.player__volume-current'),
					$playlistButton: this.$('.episode__playlist-button'),
					$playlist: this.$('.episode__playlist')
				})
				.appendTo('#sandbox');

			var $player = this.$('.episode__player')
				.data('$episode', this.$el);

			this.player = new Woopwoop($player, playerConfig);
			this.player
				.on('change:time', formatTime)
				.on('change:volume', formatVolume)
				.on('change:duration', formatDurataion)
				.on('change:buffer', formatBuffer);
			this.player.volume(0.5);
			this.player.initialize();

			this.$el
				.data({
					$player: $player,
					player: this.player
				})
				.detach();

			return this;
		}

	});

	return EpisodeView;

});