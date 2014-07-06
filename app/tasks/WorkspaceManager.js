oblib('define_task')('obie.workspace-manager', function(t) {

	t.name('Workspace Manager');
	t.hidden();

	t.init(function() {

		this._loadViewFromTemplate(__dirname + '/WorkspaceManager.html');
	
	});

	t.method('run', function() {
		bind(this);
	});

});

function bind(t) {

	t.ui.btnAdd.addEventListener('click', function(evt) {
		evt.preventDefault();
		// stop prop?

		console.log("ADD");
	});

	t.ui.btnRemove.addEventListener('click', function(evt) {
		evt.preventDefault();
		// stop prop?

		console.log("REMOVE");
	});

}