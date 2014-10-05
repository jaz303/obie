var COLORS = ['red', 'green', 'blue', 'orange', 'yellow', 'pink', 'black', 'white'];
var COLOR_IX = 0;

var MultiSplitPane = require('multi-split-pane');

oblib('define_task')('obie.workspace', function(t) {

	t.name('Workspace');
	t.hidden();

	t.init(function(cb) {
		
		this._tracks = [];
		
		this._loadViewFromTemplate(__dirname + '/index.html');

		var view = this.getView();
		
		view.style.backgroundColor = COLORS[COLOR_IX++ % COLORS.length];

		this._splitPane = new MultiSplitPane(view, {
			orientation 	: MultiSplitPane.VERTICAL
		});

		this._splitPane.addSplit(0.3333, null);
		this._splitPane.addSplit(0.6666, null);

		var self = this;
		process.nextTick(function() {
			self._splitPane.layout();
		}, 0);

	});

	// task.message('addTrack', {
	// 	description: "Add a new track to the workspace",
	// 	args: []
	// }, function() {

	// });

});