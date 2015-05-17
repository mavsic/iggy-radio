define([ 'backbone' ], function(Backbone) {

	var Programme = Backbone.Collection.extend({
		url: 'episodes/index.json',

		comparator: function(model) {
			return -model.get('date');
		}
	});

	return Programme;

})