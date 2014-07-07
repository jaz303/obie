oblib('define_task')('obie.blank', function(t) {

	t.name('Blank');
	t.hidden();

	t.init(function(cb) {
		this._loadViewFromTemplate(__dirname + '/index.html');
	});

});