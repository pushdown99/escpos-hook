var fs          = require('fs');
var path        = require('path');
var express     = require('express');
var router      = express.Router();
var app         = express();
let iconv       = require('iconv-lite');
var moment      = require('moment-timezone');
var port        = process.env.PORT || 9901;

var escpos      = require('escpos');
escpos.Console  = require('escpos-console');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname + '/public'));

/////////////////////////////////////////////////////////////////////////
//
// middleware
//
app.use(function (req, res, next) {
    req.timestamp  = moment().unix();
    req.receivedAt = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    //console.log(req.receivedAt + ': ', req.method, req.protocol +'://' + req.hostname + req.url);
    return next();
  });

//////////////////////////////////////////////////////////////
//
// Express routing
//
// listener
function checkReceipt(s) {
    console.log(s);
}


//////////////////////////////////////////////////////////////////////////////////
// EPSON ESC/P COMMAND

const ESC       =  27;  // escape code
const RESET     =  64;
const BOLD      =  69;
const UNDERLINE =  45;
const ALIGN     =  97;
const POINT     =  77;
const FONTATTR  =  38;
const COLOR     = 114;
const PAPERCUT  =  29;


function escp1(data) {
    const buf = [];
    var idx = 0;

    for(i=0; i<data.length; i++) {
        switch(data[i]) {
        case 27:
            switch (data[++i]) {
            case 64:
                process.stdout.write('<reset>');
                break;
            case 69:
                process.stdout.write('<bold:' + data[++i] + '>');       // need 1 more
                break;
            case 45:
                process.stdout.write('<underline:' + data[++i] + '>');  // 1/49 on, 0/48 off
                break;
            case 97:
                process.stdout.write('<align:' + data[++i] + '>');      // 0/48 flush left, 1/49 centered, 2/50 flush right, 3/51 fill hustification (flush right and left)
                break;
            case 77:
                process.stdout.write('<point:' + data[++i] + '>');      // 10.5-point, 12-cpi
                break;
            case 33:
                process.stdout.write('<font-attr:' + data[++i] + '>');  //
                break;
            case 100:
                process.stdout.write('<lf:' + data[++i] + '>');      // 0 - black, ...
                break;
            case 105:
                process.stdout.write('<switch:' + data[++i] + '>');      // 0 - black, ...
                break;
                case 114:
                    process.stdout.write('<color:' + data[++i] + '>');      // 0 - black, ...
                    break;
                case 29:
                    idx = i - 1;
                    process.stdout.write('<paper cut:' + data[++i] + ',' + data[++i] + '>');
                    break;
                default:
                    process.stdout.write('<unknown:' + data[i] + '>');
                    break;
                }
                break;
            default:
                //if(data[i] >= 32 && data[i] <= 122) {
                if(data[i] >= 32) {
                    buf.push(data[i]);
                    process.stdout.write(String.fromCharCode(data[i]));
                }
                else if(data[i] == 10) {
                    buf.push(data[i]);
                    console.log('<lf>');
                }
                else if(data[i] == 13) {
                    buf.push(data[i]);
                    console.log('<cr>');
                }
                else if(data[i] == 29) {
                    idx = i;
                    console.log('<paper cut:' + data[++i] + ',' + data[++i] + '>');
                }
                else {
                    buf.push(data[i]);
                    console.log(data[i]);
                }
            }
        }
       if(idx == 0) idx = data.length - 1;
    
        console.log("INDEX = " + idx);
        //let utf8s = iconv.decode(Buffer.from(buf), 'euc-kr');
        //console.log(utf8s);
        //checkReceipt(Buffer.from(buf).toString('ascii').toUpperCase());
        checkReceipt(iconv.decode(Buffer.from(buf), 'euc-kr').toUpperCase());
        //checkReceipt(iconv.decode(Buffer.from(buf), 'ascii').toUpperCase());
        let cut   = Buffer.from([10,10,10,10,10,10,10,10,10,29,86,0,0]);
        let align = Buffer.from([27,92,2,13,10,13]);
        let lfeed = Buffer.from([10]);
        let foot  = Buffer.from('How Many Calories Should You Eat on Average? Stop!!!');
    
        //console.log(idx + "," + data.indexOf(Buffer.from([10,10])));
        //idx = data.indexOf(Buffer.from([10,10]));
        //idx = idx+1;
        let txt = Buffer.concat([Buffer.from(data).slice(0, idx), align, foot, lfeed, cut]);
        console.log(Buffer.from(txt).slice(idx, -1));
    
        return Buffer.from(txt).toString('hex');
    }
    
    app.post('/', function(req, res) {
    
        var device  = new escpos.Console();
        var printer = escpos.Printer(device);
    
        device.open(function(error) {
            printer.buffer.write(Buffer.from(req.body.Data, 'hex'));
            printer.buffer.writeCString("Hello World").join();
        });
        res.send(Buffer.from(printer.buffer._buffer).toString('hex'));
        //res.send(escp1(Buffer.from(req.body.Data, 'hex')));
        //res.send(req.body.Data);
    });
    
    
    ////////////////////////////////////////////////////////
    // listener
    app.listen(port, function(){
        console.log('Listener: ', 'Example app listening on port ' + port);
    });
    
    module.exports = app;
    