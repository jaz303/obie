if (typeof process !== 'undefined') {
    module.exports = process.nextTick;    
} else {
    module.exports = function(fn) {
        setTimeout(fn, 0);
    }
}