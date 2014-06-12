
global.oblib = function(lib) { return require('./lib/' + lib); };
global.obapi = function(api) { return require('./api/' + api); };

exports.init = function(window, document) {

	var signals = oblib('signals');

	signals.register('taskRegistered');
	signals.register('taskSpawned');

	var kernel = oblib('kernel');

	var wsm = kernel.spawn('obie.workspace-manager');
	// TODO: present wsm.view to the view engine
	
}