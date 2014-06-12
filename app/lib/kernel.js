var debug           = oblib('debug')('ob:kernel');

var registry        = culib('task_registry'),
    taskSpawned     = culib('signals').taskSpawned,
    nextTick        = culib('next_tick'),
    k               = culib('k');

var util            = require('util');

var activeTasks     = [ null ], // task ID 0 is invalid so reserve it
    recycledTaskIds = [],
    nextTaskId      = 1;

var NO_OP           = function() {};

function assert(cond, msg) {
    if (!cond) {
        console.error("Assertion failed");
        console.error(msg);
        throw "kernel assertion failed";
    }
}

function taskId(t) {
    return (typeof t === 'number') ? t : t.__id;
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

function spawn(taskDescriptor, parentTask) {

    if (typeof taskDescriptor === 'string') {
        taskDescriptor = registry.lookup(taskDescriptor);
    }
        
    if (!taskDescriptor || typeof taskDescriptor.create !== 'function') {
        console.error("can't create task - invalid task descriptor");
        return null;
    }

    var parentId = null;
    if (parentTask) {
        
        parentId = taskId(parentTask);

        if (!parentId || !activeTasks[parentId]) {
            console.error("can't spawn task - invalid parent ID");
            return null;
        }

        if (activeTasks[parentId].state !== k.TASK_STATUS_RUNNING) {
            console.error("can't spawn task - parent is in invalid state");
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

    var tid = task.__id = generateTaskId();
    
    var entry = activeTasks[tid] = {
        descriptor  : taskDescriptor,
        task        : task,
        parentId    : parentId,
        children    : [],
        connections : [],
        state       : k.TASK_STATUS_SETUP,
        startTime   : Date.now()
    };

    try {
        task.setup();
    } catch (e) {
        
        console.warn("error caught from Task::setup(), tid = " + tid);
        console.warn("the task has not been spawned");
        console.error(e);
        
        activeTasks[tid] = null;
        recycleTaskId(tid);

        return null;

    }

    if (parentId) {
        activeTasks[parentId].children.push(tid);
    }

    nextTick(function() {
        if (entry.state === k.TASK_STATUS_SETUP) {
            try {
                entry.state = k.TASK_STATUS_RUNNING;
                task.start();
            } catch (e) {
                console.warn("error caught from Task::start(), tid = " + tid);
                console.warn("the task has not been killed");
                console.error(e);
            }
        }
    });

    taskSpawned.emit(task.__id, task);

    return task;

}

function kill(task) {

    var tid = taskId(task);
    if (!tid)
        return false;

    var entry = activeTasks[tid];
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

    //
    // Next, destroy all connections

    entry.connections.forEach(function(cid) {
        destroyConnection(cid, tid);
    });

    //
    // Now run the task's custom destroy handler

    task = entry.task;

    if (typeof task.destroy === 'function') {
        try {
            task.destroy();
        } catch (e) {
            console.warn("error caught whilst killing task " + tid);
            console.error(e);
        }
    }

    //
    // Prevent task from receiving any messages

    // Prevent destroyed tasks from responding to new messages
    task.send = NO_OP;

    //
    // Housekeeping

    entry.state = k.TASK_STATUS_DEAD;

    activeTasks[tid] = null;
    recycleTaskId(tid);

    if (entry.parentId) {
        var parent = activeTasks[entry.parentId];
        parent.children.splice(parent.children.indexOf(tid), 1);
        parent.task.childKilled(tid);
    }

    return true;

}

function getTaskById(id) {
    var entry = activeTasks[id];
    return entry ? entry.task : null;
}

function getTaskType(tid) {
    var entry = activeTasks[tid];
    return entry ? entry.descriptor.id : null;
}

function send(taskId, msg, args) {
    
    var entry = activeTasks[taskId];

    if (!entry)
        return false;

    try {
        entry.task.send(msg, args || []);    
    } catch (e) {
        console.warn("error caught whilst sending message %s to task %d", msg, taskId);
        console.error(e);
    }

    return true;

}

function detach(tid) {

    var entry = activeTasks[tid];

    if (!entry || !entry.parentId || entry.state !== k.TASK_STATUS_RUNNING)
        return false;

    var ptid    = entry.parentId,
        parent  = activeTasks[ptid];

    parent.children.splice(parent.children.indexOf(tid), 1);
    entry.parentId = null;

    try {
        parent.task.childDetached(tid);
    } catch (e) {
        console.warn("error caught in Task::childDetached(). ptid=%d, tid=%d", ptid, tid);
        console.error(e);
    }
    
    return true;

}

function attach(tid, ptid) {

    var entry = activeTasks[tid];

    if (!entry || entry.parentId || entry.state !== k.TASK_STATUS_RUNNING)
        return false;

    var newParent = activeTasks[ptid];

    if (!newParent)
        return false;

    newParent.children.push(tid);
    entry.parentId = ptid;

    try {
        newParent.task.childAttached(tid);
    } catch (e) {
        console.warn("error caught in Task::childAttached(). ptid=%d, tid=%d", ptid, tid);
        console.error(e);
    }

    return true;

}

//
// Wait

// TODO: there's a race condition here - in theory a task could
// die and then a new one spawn with the same task ID, thus satisfying
// the request. Possible fixes: give every task a hidden, internal UUID
// that we can stash in here. Or prevent task IDs being reused, within,
// say, 60 seconds.
function waitAll(tids, cb) {

    if (!util.isArray(tids)) {
        tids = [tids];
    }

    var count           = tids.length,
        retryInterval   = 100;

    setTimeout(function poll() {

        for (var i = 0; i < count; ++i) {
            
            var task = activeTasks[tids[i]];

            if (!task || task.state === k.TASK_STATUS_DEAD) {
                cb(true);
                return;
            }

            if (task.state !== k.TASK_STATUS_RUNNING) {
                setTimeout(poll, retryInterval);
                return;
            }

        }

        cb(false);

    }, 0);

}

//
// Connections

var activeConnections       = [null],
    recycledConnectionIds   = [],
    nextConnectionId        = 1;

function generateConnectionId() {
    if (recycledConnectionIds.length > 0) {
        return recycledConnectionIds.shift();
    } else {
        return nextConnectionId++;
    }
}

function recycleConnectionId(id) {
    recycledConnectionIds.push(id);
}

// Register a connection between task IDs tid1 and tid2
//
// If either tid1 or tid2 is killed before the connection is destroyed
// the supplied destructor function will be fired.
//
// createConnection() returns a unique ID that can be used to de-register
// the same connection manually, in which case the destructor function
// will also be fired.
//
// The destructor function receives a single parameter - either the tid
// of the task that was killed, or a falsey value if the connection
// was removed manually from "userland".
//
// The ONLY VALID WAY to destroy a connection created in this way is by
// a corresponding call to destroyConnection() so set up your code so all
// necessary teardown work is performed inside the destructor. (see
// _addDelegate() in lib/define_task.js for an example)
//
function createConnection(tid1, tid2, destructor) {

    // assert(typeof tid1 === 'number', 'tid1 must be a number');
    // assert(typeof tid2 === 'number', 'tid2 must be a number');
    // assert(typeof destructor === 'function', 'destructor must be a function');

    var t1 = activeTasks[tid1],
        t2 = activeTasks[tid2];

    if (!t1 || !t2)
        return null;

    var cid = generateConnectionId();
    
    activeConnections[cid] = {
        t1          : tid1,
        t2          : tid2,
        destructor  : destructor
    };

    t1.connections.push(cid);
    t2.connections.push(cid);

    return cid;

}

// TODO: `dyingTid` should not be supplied from userland.
// split this up into 2 functions - private and public
function destroyConnection(cid, dyingTid) {

    // assert(typeof cid === 'number', 'connection ID must be a number');
    // assert((!dyingTid || typeof dyingTid === 'number'), 'dying TID must be a number');

    var conn = activeConnections[cid];

    if (!conn)
        return false;

    activeConnections[cid] = null;

    var t, cs;

    if (dyingTid !== conn.t1) {
        t = activeTasks[conn.t1];
        cs = t.connections;
        cs.splice(cs.indexOf(cid), 1);    
    }

    if (dyingTid !== conn.t2) {
        t = activeTasks[conn.t2];
        cs = t.connections;
        cs.splice(cs.indexOf(cid), 1);
    }
    
    try {
        conn.destructor(false);    
    } catch (e) {
        console.warn("error caught in connection destructor, cid=%d", cid);
        console.error(e);
    }

    return true;

}

//
//

exports.spawn               = spawn;
exports.kill                = kill;
exports.getTaskById         = getTaskById;
exports.getTaskType         = getTaskType;
exports.send                = send;
exports.detach              = detach;
exports.attach              = attach;
exports.waitAll             = waitAll;
exports.createConnection    = createConnection;
exports.destroyConnection   = destroyConnection;