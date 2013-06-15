/* @TODO
Remove fs.watch() and build it on top of a queue system(Use Node or CouchDB Easy Sharding!)
* Read here: http://stackoverflow.com/questions/9274777/mongodb-as-a-queue-service
Implement multithreding( should be REALLY EASY ) GREAT Thx Node!
Instad of writing on the fs publish it to CloudFront.
Note:
 Install the less compiler and the queue on the same server(each node will be identical and everything sharded) GREAT!
*/

// Load modules
var express = require('../node_modules/express')
    , format = require('util').format
    , fs = require('fs')
    , less = require('../node_modules/less')
    , path = require('path');

//Create Express App
var app = module.exports = express();

//Some configuration
app.set('inputFolder','./less_files/');
app.set('bootstrapFolder','./twitter-bootstrap/');
app.set('outputFolder','./public/sampleApp/'+ app.get('bootstrapFolder'));
app.set('themeFolder','./public/bootswatch/')

//Not sure if necessary.
app.use(express.bodyParser())
//app.use(express.directory('app'))
//app.use(express.directory('twitter-bootstrap'))

//Just serve everything!
app.get(/^(.+)$/, function(req, res) { res.sendfile('public/' + req.params[0]); });

/* Save .less into the input folder, variables are passed as pure text */
app.post('/app/save/*', function(req, res, next){
    // Add Import to get the bootstrap stuff, HACK. The bootstrap less files should not import the variables.less file.
    var BS = app.get('bootstrapFolder') + 'less/bootstrap.less';
    var BSR = app.get('bootstrapFolder') + 'less/responsive.less';

    /** IF I POST FULL VARIABLES, but after all I can just use the theme name ;)*/
    fs.writeFile( app.get('inputFolder') + 'bootstrap-testLess.less', req.body.lessObj+"@import \""+BS+"\"; \n", function(err) {
        if(err) {
            res.json(500, { error: err });
            console.log(err);
        } else {
            fs.writeFile( app.get('inputFolder') + 'responsive-testLess.less', req.body.lessObj+"@import \""+BSR+"\"; \n", function(err) {
                if(err) {
                    res.json(500, { error: err });
                    //console.log(err);
                }
                else{
                    res.json(200, { success: "The file was saved!" })
                    //console.log("The file was saved!");
                }
            });
        }
    });
});

/* Save a bootswatch theme to the input folder */
app.post('/app/savetheme/*',function(req, res, next){
    var BS = app.get('bootstrapFolder') + 'less/bootstrap.less';
    var BSR = app.get('bootstrapFolder') + 'less/responsive.less';
    var theme = fs.readFileSync(app.get('themeFolder')+ req.body.themeName+"/variables.less") + fs.readFileSync(app.get('themeFolder')+ req.body.themeName+"/bootswatch.less");


    fs.writeFile(app.get('inputFolder') + 'bootstrap-testLess.less',theme + "@import \""+BS+"\";");
    fs.writeFile(app.get('inputFolder') + 'responsive-testLess.less',theme + "@import \""+BSR+"\";")
    /*
    writing in a non blocking way. : )
    var fsBS = fs.createWriteStream(app.get('inputFolder') + 'bootstrap-testLess.less',{ flags: 'w', encoding: 'utf-8', mode: 0666 });
    fsBS.on('open',function(){
        fsBS.append(theme)
        fsBS.append("@import \""+BS+"\";")
    });
    */
    /*
    var fsBSR = fs.createWriteStream(app.get('inputFolder') + 'responsive-testLess.less',{ flags: 'w', encoding: 'utf-8', mode: 0666 });
    fsBSR.on('open',function(){
        fsBSR.append(theme)
        fsBSR.append("@import \""+BSR+"\";")
    });
*/
});

/*  LESS COMPILER  */
var lessCompile = function (targetFile, data){
    var dataString = data.toString();
    var options = {
        paths         : [app.get('inputFolder')],      // .less file search paths
        outputDir     : app.get('outputFolder'),   // output directory, note the '/'
        optimization  : 1,                // optimization level, higher is better but more volatile - 1 is a good value
        filename      : targetFile,       // root .less file
        compress      : true,             // compress?
        yuicompress   : false              // use YUI compressor?
    };
    options.outputfile = options.filename.split(".less")[0] + (options.compress ? ".min" : "") + ".css";
    options.outputDir = path.resolve( process.cwd(), options.outputDir) + "/";
    ensureDirectory( options.outputDir );
    var parser = new less.Parser(options);
    parser.parse( dataString, function ( error, cssTree ) {
        if ( error ) {
            less.writeError( error, options );
            return;
        }
        var cssString = cssTree.toCSS( {
            compress   : options.compress,
            yuicompress: options.yuicompress
        } );
        fs.writeFileSync( options.outputDir + options.outputfile, cssString, 'utf8' );
    });
}
var ensureDirectory = function (filepath) {
    var dir = path.dirname(filepath);
    var existsSync = fs.existsSync || path.existsSync;
    if (!existsSync(dir)) { fs.mkdirSync(dir); }
};
fs.watch('./less_files', function (event, targetfile){
    if(targetfile != null){
        fs.readFile(app.get('inputFolder') + targetfile,function(error,data){
            var dataString = data.toString();
            if(data!=null && data != ""){
                lessCompile(targetfile, dataString);
            }
        });
    }
});
fs.watch()
if (!module.parent) {
    app.listen(3000);
    console.log('App started on port 3000');
}
/*
function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}
    */