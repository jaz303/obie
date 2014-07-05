oblib('define_task')('obie.workspace', function(task) {

	task.init(function(cb) {

		this._tracks = [];

		// TODO: create structure and assign to this.view

	});

	task.hidden();

	task.message('addTrack', {
		description: "Add a new track to the workspace",
		args: []
	}, function() {

	});

});