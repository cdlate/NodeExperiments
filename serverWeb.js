// Load modules
var express = require('express')
    , fs    = require('fs')
    , path  = require('path');

//Create Express App
var app = module.exports = express();

//Some configuration
app.set('inputFolder','./less_files/');
app.set('bootstrapFolder','./twitter-bootstrap/');
app.set('outputFolder','./public/sampleApp/'+ app.get('bootstrapFolder'));
app.set('themeFolder','./public/bootswatch/')
app.use(express.bodyParser())

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
                }
                else{
                    res.json(200, { success: "The file was saved!" })
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
    fs.writeFileSync(app.get('inputFolder') + 'bootstrap-testLess.less',theme + "@import \""+BS+"\";");
    fs.writeFileSync(app.get('inputFolder') + 'responsive-testLess.less',theme + "@import \""+BSR+"\";");
});

if (!module.parent) {
    app.listen(3000);
    console.log('App started on port 3000');
}