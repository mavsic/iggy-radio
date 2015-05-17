define([ 'jquery', 'underscore', 'backbone', 'views/episode' ], function($, _, Backbone, EpisodeView) {

	var ProgrammeView = Backbone.View.extend({
		className: 'episodes',

		initialize: function() {
			this.players = [];
		},

		pauseAllExcept: function(player) {
			_.chain(this.players)
				.reject(function(p) {
					return p === player;
				})
				.invoke('pause');
		},

		render: function() {
			var self = this;

			for (var i = 0; i < this.collection.length; i++) {
				(function() {
					var view = new EpisodeView({ model: self.collection.at(i) });
					view.render();
					self.$el.append(view.el);
					i == 0 && view.togglePlaylist();

					self.players.push(view.player);
					self.listenTo(view.player, 'state:playing', function() {
						self.pauseAllExcept(view.player);
					});
				})();
			}
		}
	});

	return ProgrammeView;

});