var kernel = oblib('kernel');
var du = require('domutil');

oblib('define_task')('obie.workspace-manager', function(t) {

	t.name('Workspace Manager');
	t.hidden();

	t.init(function() {
		this._workspaces = [];
		this._activeWorkspace = -1;
		this._loadViewFromTemplate(__dirname + '/index.html');
	});

	t.method('run', function() {
		bind(this);
	});

	t.method('childKilled', function(tid) {
		removeWorkspaceByTaskId(this, tid);
	});

	t.message('createWorkspace', {}, function() {
		if (addWorkspace(this)) {
			switchToWorkspace(this, this._workspaces.length - 1);
		}
	});

	t.message('destroyActiveWorkspace', {}, function() {
		if (this._activeWorkspace >= 0) {
			destroyWorkspace(this, this._activeWorkspace);
		}
	});

	t.message('switchToWorkspace', {}, function(workspace) {
		switchToWorkspace(this, workspace - 1);
	});

});

function bind(wm) {

	wm.ui.btnCreate.addEventListener('click', function(evt) {
		evt.preventDefault();
		wm.createWorkspace();
	});

	wm.ui.btnDestroy.addEventListener('click', function(evt) {
		evt.preventDefault();
		wm.destroyActiveWorkspace();
	});

	du.delegate(wm.ui.switcher, 'click', 'a', function(evt) {
		evt.preventDefault();
		switchToWorkspace(
			wm,
			parseInt(evt.delegateTarget.getAttribute('ob-workspace-ix'))
		);
	});

}

function addWorkspace(wm) {

	var newTask = wm.spawn('obie.workspace');
	if (!newTask) {
		return false;
	}

	var newView = newTask.getView();
	newView.style.display = 'none';

	var icon = document.createElement('a');
	icon.className = 'button fixed-width';
	icon.href = '#';
	icon.textContent = wm._workspaces.length + 1;
	icon.setAttribute('ob-workspace-ix', wm._workspaces.length);
	wm.ui.switcher.appendChild(icon);

	var entry = {
		tid 		: newTask.id,
		task 		: newTask,
		view 		: newView,
		needsLayout	: true
	};

	wm.ui.workspaces.appendChild(newView);
	wm._workspaces.push(entry);

	return true;

}

function destroyWorkspace(wm, wix) {
	var ws = wm._workspaces[wix];
	if (ws) {
		kernel.kill(ws.tid);
	}
}

function removeWorkspaceByTaskId(wm, tid) {
	for (var i = 0, wl = wm._workspaces, l = wl.length; i < l; ++i) {
		var workspace = wl[i];
		if (workspace.tid === tid) {

			var previousWorkspace = wm._activeWorkspace;
			if (previousWorkspace >= i) {
				switchToWorkspace(wm, -1);
			}

			wm.ui.workspaces.removeChild(workspace.view);
			wl.splice(i, 1);
			wm.ui.switcher.removeChild(wm.ui.switcher.lastChild);

			if ((previousWorkspace === i) && (i < wl.length)) {
				switchToWorkspace(wm, previousWorkspace);
			} else if (previousWorkspace >= i) {
				switchToWorkspace(wm, previousWorkspace - 1);
			}

			return;

		}
	}
}

function switchToWorkspace(wm, wix) {

	if (wix === wm._activeWorkspace || wix >= wm._workspaces.length) {
		return;
	}

	if (wm._activeWorkspace >= 0) {
		var activeWorkspace = wm._workspaces[wm._activeWorkspace];
		activeWorkspace.view.style.display = 'none';
	}

	if (wix >= 0) {
		var newWorkspace = wm._workspaces[wix];
		newWorkspace.view.style.display = 'block';
		if (newWorkspace.needsLayout) {
			// newWorkspace.view.layout();
			newWorkspace.needsLayout = false;
		}
	}

	wm._activeWorkspace = wix;
	updateWorkspaceSelector(wm);

}

function updateWorkspaceSelector(wm) {

	var wix         = wm._activeWorkspace,
	    selectors   = wm.ui.switcher.childNodes;
	
	for (var i = 0, l = selectors.length; i < l; ++i) {
	    du[(i === wix) ? 'addClass' : 'removeClass'](selectors[i], 'active');
	}
	
}

function activeWorkspaceTask() {
	if (wm._activeWorkspace >= 0) {
		return wm._workspaces[wm._activeWorkspace].task;
	} else {
		return null;
	}
}