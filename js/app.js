require.config({
	paths: {
		'jquery': 'lib/jquery-2.1.3',
		'backbone': 'lib/backbone',
		'underscore': 'lib/underscore',
		'moment': 'lib/moment',
		'mustache': 'lib/mustache',
		'text': 'lib/text',
		'templates': '../templates'
	}
});

require([ 'jquery', 'moment', 'collections/programme', 'views/programme' ], function($, moment, Programme, ProgrammeView) {

	var programme = new Programme();
	programme
		.fetch({ reset: true })
		.done(function() {
			var view = new ProgrammeView({ collection: programme });
			view.render();
			$('#episodes-list').append(view.el);
			$('#next-date').text(moment.utc(programme.at(0).get('date')).add(7, 'd').format('MMMM Do'));
		});

});