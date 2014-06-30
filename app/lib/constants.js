var K = {
    
    TASK_STATUS_INIT            : 'init',
    TASK_STATUS_RUNNING         : 'running',
    TASK_STATUS_DEAD            : 'dead',

};

for (var k in K) {
    Object.defineProperty(exports, k, {
        value: K[k],
        writable: false
    });
}