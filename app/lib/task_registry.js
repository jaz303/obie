var tasks = {};

var onTaskRegistered = oblib('signals').taskRegistered;

function all() {
    var allTasks = [];
    for (var taskId in tasks)
        allTasks.push(tasks[taskId]);
    return allTasks;
}

function lookup(taskId) {
    return tasks[taskId] || null;
}

function exists(taskId) {
    return (taskId in tasks);
}

function register(taskDescriptor) {

    if (typeof taskDescriptor.id !== 'string')
        throw new Error("can't register task without an ID");

    if (exists(taskDescriptor.id))
        throw new Error("duplicate task ID: " + taskDescriptor.id);

    tasks[taskDescriptor.id] = taskDescriptor;

    onTaskRegistered.emit(taskDescriptor);

}

exports.all                 = all;
exports.lookup              = lookup;
exports.exists              = exists;
exports.register            = register;