/* @TODO
 Remove fs.watch() and build it on top of a queue system(Use Node or CouchDB Easy Sharding!)
 * Read here: http://stackoverflow.com/questions/9274777/mongodb-as-a-queue-service
 Implement multithreding( should be REALLY EASY ) GREAT Thx Node!
 Instad of writing on the fs publish it to CloudFront.

 Note:
 Install the less compiler and the queue on the same server(each node will be identical and everything sharded) GREAT!
 //CloudFront   -> Shared
 //FileSystem   -> Shared(Locally)
 //CouchDB      -> Shared(All)
 */

var fs = require('fs')
    , less = require('less')
    , path = require('path')
    , config = require('./config.json');

/*  Publish  */
var publish = function(fileName,content){
    var outputFile = fileName.split(".less")[0] +  ".css";
    var outputDir  = path.resolve( process.cwd(), config.outputFolder) + "/";
    ensureDirectory( outputDir );
    fs.writeFileSync( outputDir + outputFile, content, 'utf8' );
}

/*  LESS COMPILER  */
var lessCompile = function (options, data, cb){
    var fileName = options.filename.toString();
    var dataString = data.toString();
    var parser = new less.Parser(options);

    parser.parse( dataString, function ( error, cssTree ) {
        if(!error){
            var cssString = cssTree.toCSS({
                compress   : options.compress,
                yuicompress: options.yuicompress
            });
            cb(fileName, cssString);
        }
        else{
            console.log("Invalid Less File.");
        }
    });
};


var ensureDirectory = function (filepath) {
    var dir = path.dirname(filepath);
    var existsSync = fs.existsSync || path.existsSync;
    if (!existsSync(dir)) { fs.mkdirSync(dir); }
};

fs.watch(config.inputFolder, function (event, targetfile){
    console.log("NEW LESS FILE TO COMPILE!");
    if(targetfile != null){
        var options = {
            paths         : [config.inputFolder],   // .less file search paths
            outputDir     : config.outputFolder,    // output directory, note the '/'
            optimization  : 1,                      // optimization level, higher is better but more volatile - 1 is a good value
            filename      : targetfile,             // root .less file
            compress      : true,                   // compress?
            yuicompress   : false                   // use YUI compressor?
        };
        fs.readFile(path.resolve( process.cwd(), config.inputFolder)+ "/" + targetfile, function(error,data){
            if(data!=null){
                var dataString = data.toString();
                lessCompile(options, dataString, publish);
            }
            else{
                console.log(path.resolve( process.cwd(), config.inputFolder)+ "/" + targetfile);
            }
        });
    }
});
