var registry		= oblib('task_registry');
var taskSpawned		= oblib('signals').taskSpawned;
var nextTick		= oblib('next_tick');
var k 				= oblib('constants');

var tasks		    = [ null ]; // task ID 0 is invalid so reserve it
var tasksInternal   = [ null ];
var recycledTaskIds	= [];
var nextTaskId		= 1;

exports.spawn               = spawn;
exports.kill                = kill;
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

function spawn(taskType, parentTaskId) {

    if (typeof taskType !== 'string') {
        console.error("[kernel] spawn() : task type must be a string");
        return null;
    }

    var taskDescriptor = registry.lookup(taskType);
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
        throw e;
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

function kill(tid) {

    var entry = tasksInternal[tid];
    if (!entry)
        return false;

    //
    // OK, task to kill is valid.
    // First thing to do is kill all of it's children.

    if (entry.children.length) {
        entry.children.slice(0).forEach(function(child) {
            kill(child);
        });
    }

    // TODO: destroy connections!

    //
    // Now run the task's custom destroy handler

    task = tasks[tid];

    try {
        task.destroy();
    } catch (e) {
        console.warn("error caught whilst killing task " + tid);
        console.error(e);
    }

    // TODO: prevent task from receiving messages?
    // // Prevent destroyed tasks from responding to new messages
    // task.send = NO_OP;

    //
    // Housekeeping

    entry.state = k.TASK_STATUS_DEAD;

    tasks[tid] = tasksInternal[tid] = null;
    recycleTaskId(tid);

    if (entry.parentId) {
        var parentInt = tasksInternal[entry.parentId];
        parentInt.children.splice(parentInt.children.indexOf(tid), 1);
        try {
            tasks[entry.parentId].childKilled(tid);    
        } catch (e) {
            console.warn("error caught from Task::childKilled(), tid = " + tid);
            console.error(e);
        }
    }

    return true;

}

//
// Internals

function assert(cond, msg) {
    if (!cond) {
        console.error("!!! Kernel assertion failed !!!");
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