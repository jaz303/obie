var COLORS = ['red', 'green', 'blue', 'orange', 'yellow', 'pink', 'black', 'white'];
var COLOR_IX = 0;

oblib('define_task')('obie.workspace', function(t) {

	t.name('Workspace');
	t.hidden();

	t.init(function(cb) {
		this._tracks = [];
		this._loadViewFromTemplate(__dirname + '/index.html');
		this.getView().style.backgroundColor = COLORS[COLOR_IX++ % COLORS.length];
	});

	// task.message('addTrack', {
	// 	description: "Add a new track to the workspace",
	// 	args: []
	// }, function() {

	// });

});