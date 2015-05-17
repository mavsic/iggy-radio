define(['jquery'], function($) {

	var body = $('body');

	var translateCoords = function(e, offset) {
		return {
			offsetX: e.pageX - offset.left,
			offsetY: e.pageY - offset.top
		};
	};

	$.fn.mousedrag = function() {

		this.on('mousedown.mousedrag', function(e) {
			var target = $(this);

			body
				.addClass('dragging')
				.on('mousemove.mousedrag', function(e) {
					target.trigger('mousedrag', translateCoords(e, target.offset()));
				})
				.one('mouseup', function(e) {
					body
						.removeClass('dragging')
						.unbind('mousemove');

					target.trigger('mousedrop', translateCoords(e, target.offset()));
				});

			target.trigger('mousedrag', {
				offsetX: e.offsetX,
				offsetY: e.offsetY
			});
		});

		return this;

	};

});