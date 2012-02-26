module.exports = {
    /*
        loads all files in the folder. Each file is expected to be a export
            a module which is then attached to the core under a filename

        Modules are stored by the naming convention of <fileName> if directly
            in the folder or <folder>.<fileName>, <folder>.<folder>.<fileName>
            if stored nested in the folder

        @param {String} uri - uri of the folder to load
        @param {Object} dependencies - A dependency mapping for the
            files in the folder (uri). This is based on files/folderNames
    */
    load: function load(uri, dependencies) {
        
    },
    expose: ["load"]
};