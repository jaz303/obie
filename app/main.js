global.oblib = function(lib) { return require('./lib/' + lib); };
global.obapi = function(api) { return require('./api/' + api); };

var domLoad = require('./lib/dom_loader');
global.obtpl = function(tpl) { return domLoad(tpl); }

var signals = oblib('signals');

function loadPlugin(mod) {
	mod.init();
}

exports.init = function(window) {

	global.window	= window;
	global.document	= window.document;

	//
	//

	loadPlugin(require('./plugins/error_reporting'));

	signals.register('taskRegistered');
	signals.register('taskSpawned');

	require('./tasks/Workspace');
	require('./tasks/WorkspaceManager');

	var kernel = require('./lib/kernel');

	var manager = kernel.spawn('obie.workspace-manager');
	document.body.appendChild(manager.getView());
	
}
