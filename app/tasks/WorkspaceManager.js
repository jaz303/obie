oblib('define_task')('obie.workspace-manager', function(t) {

	t.name('Workspace Manager');
	t.hidden();

	t.init(function() {

		this._view = document.createElement('div');
		this._view.className = 'ob-workspace-manager';
	
	});

	t.method('run', function() {
		console.log("RUN WORKSPACE MANAGER!");
	});

});