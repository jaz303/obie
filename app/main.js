global.oblib = function(lib) { return require('./lib/' + lib); };
global.obapi = function(api) { return require('./api/' + api); };

function loadPlugin(mod) {
	mod.init();
}

exports.init = function(window) {

	global.window	= window;
	global.document	= window.document;

	//
	//

	loadPlugin(require('./plugins/error_reporting'));

	var signals = oblib('signals');

	signals.register('taskRegistered');
	signals.register('taskSpawned');

	throw new Error("broken broken!");

	// var kernel = oblib('kernel');

	// var wsm = kernel.spawn('obie.workspace-manager');
	// TODO: present wsm.view to the view engine
	
}
