require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const dns = require ('dns');
const urlParser = require ('url');

//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

const mongoose = require('mongoose');
const AutoIncrementFactory = require('mongoose-sequence');
const DB_URI = process.env.DB_URI;//'mongodb+srv://usermongo:kellepaca1@cluster0.ztdpa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
// establishing a database connection
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const AutoIncrement = AutoIncrementFactory(mongoose.connection);

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  fullUrl: String
});
urlSchema.plugin(AutoIncrement, {inc_field: 'id'});

let Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  const  formUrl = req.body.url;

  console.log('PPP:', urlParser.parse(formUrl).hostname);
  const exist = dns.lookup(urlParser.parse(formUrl).hostname, (err, addr) => {
    if(!addr){
      res.json({ error: 'invalid url' });
      return;
    }
  });
  
  const result = await Url.findOne({ fullUrl: formUrl });
  if(result){
    console.log('BODY URL EXIST', result);
    res.json( {"original_url":result.fullUrl, "short_url":result.id});
    return;    
  }

  console.log('BODY URL NOT EXIST');
  let id = 0; 
  var url = new Url({ 
      fullUrl: formUrl
  });
  const sr = await url.save();
  console.log('SAVE RESULT:', sr);
  res.json({"original_url":sr.fullUrl, "short_url":sr.id});
});

// Your first API endpoint
app.get('/api/shorturl/:shortid', async function(req, res) {
  let shortUrlId = req.params.shortid;
  let result ={ error: 'invalid url' };
  if(shortUrlId){    
    const urlResult = await Url.findOne({ id: shortUrlId });    
    if(urlResult){
      res.redirect(urlResult.fullUrl);
      return;
    }
  } 
  
  res.json(result);  
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
