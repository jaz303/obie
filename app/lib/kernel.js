var registry		= oblib('task_registry');
var taskSpawned		= oblib('signals').taskSpawned;
var nextTick		= oblib('next_tick');
var k 				= oblib('constants');

var tasks		    = [ null ]; // task ID 0 is invalid so reserve it
var tasksInternal   = [ null ];
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

function spawn(taskDescriptor, parentTaskId) {

    if (typeof taskDescriptor === 'string') {
        taskDescriptor = registry.lookup(taskDescriptor);
    }

    if (!taskDescriptor || typeof taskDescriptor.create !== 'function') {
        console.error("can't create task - invalid task descriptor");
        return null;
    }

    parentTaskId = parentTaskId || null;
    if (parentTaskId) {
        if (typeof parentTaskId !== 'number') {
            console.error("can't create task - parent task ID must be numeric");
            return null;
        }

        if (!tasks[parentTaskId]) {
            console.error("can't create task - parent task ID is invalid");
            return null;
        }

        if (tasksInternal[parentTaskId].state !== k.TASK_STATUS_RUNNING) {
            console.error("can't create task - parent task is in invalid state");
            return null;
        }
    }

    try {
        var task = taskDescriptor.create();
    } catch (e) {
        console.warn("error caught from TaskDescriptor::create()");
        console.warn("the task has not been spawned");
        console.error(e);
        return null;
    }

    var tid = generateTaskId();
    Object.defineProperty(task, 'id', { value: tid, writable: false });

    tasks[tid] = task;
    var entry = tasksInternal[tid] = {
        descriptor      : taskDescriptor,
        parentId        : parentTaskId,
        children        : [],
        state           : k.TASK_STATUS_INIT,
        startTime       : Date.now()
    };

    // Task has been created. Next step is initialisation.
    try {
        task.init();
    } catch (e) {

        console.warn("error caught from Task::init(), tid = " + tid);
        console.warn("the task has not been spawned");
        console.error(e);
        
        entry.state = k.TASK_STATUS_DEAD;
        tasks[tid] = tasksInternal[tid] = null;
        recycleTaskId(tid);

        return null;

    }

    if (entry.state !== k.TASK_STATUS_INIT) {
        console.warn("task initialisation callback called after initialisation failed!");
        return false;
    }

    if (parentTaskId) {
        tasksInternal[parentTaskId].children.push(tid);
    }

    nextTick(_start);
    taskSpawned.emit(tid, task);
    return task;

    function _start() {

        // Task has already been killed - nothing to do.
        if (entry.state === k.TASK_STATUS_DEAD) {
            return;
        }

        assert(entry.state === k.TASK_STATUS_INIT, "expected task state TASK_STATUS_INIT");

        // set the task's status to running + call task's run() method.
        // An exception raised in run() is not a fatal error and does not
        // kill the task.
        try {
            entry.state = k.TASK_STATUS_RUNNING;
            task.run();
        } catch (e) {
            console.warn("error caught from Task::start(), tid = " + tid);
            console.warn("the task has not been killed");
            console.error(e);
        }

    }

}

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