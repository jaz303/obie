var registry		= oblib('task_registry');
var taskSpawned		= oblib('signals').taskSpawned;
var nextTick		= oblib('next_tick');
var k 				= oblib('constants');

var activeTasks		= [ null ]; // task ID 0 is invalid so reserve it
var recycledTaskIds	= [];
var nextTaskId		= 1;

exports.spawn               = spawn;
// exports.kill                = kill;
// exports.getTaskById         = getTaskById;
// exports.getTaskType         = getTaskType;
// exports.send                = send;
// exports.detach              = detach;
// exports.attach              = attach;
// exports.waitAll             = waitAll;
// exports.createConnection    = createConnection;
// exports.destroyConnection   = destroyConnection;

//
// Public interface


//
// Internals

function assert(cond, msg) {
    if (!cond) {
        console.error("Assertion failed");
        console.error(msg);
        throw new Error("kernel assertion failed: " + msg);
    }
}

function generateTaskId() {
    if (recycledTaskIds.length > 0) {
        return recycledTaskIds.shift();
    } else {
        return nextTaskId++;
    }
}

function recycleTaskId(id) {
    recycledTaskIds.push(id);
}