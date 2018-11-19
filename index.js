var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var pokeDataUtil = require("./poke-data-util");
var _ = require("underscore");
var app = express();
var PORT = 3000;

// Restore original data into poke.json. 
// Leave this here if you want to restore the original dataset 
// and reverse the edits you made. 
// For example, if you add certain weaknesses to Squirtle, this
// will make sure Squirtle is reset back to its original state 
// after you restard your server. 
pokeDataUtil.restoreOriginalData();

// Load contents of poke.json into global variable. 
var _DATA = pokeDataUtil.loadData().pokemon;

/// Setup body-parser. No need to touch this.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Web

app.get("/", function(req, res) {   
    var contents = "";
    _.each(_DATA, function(ele, index, list) {
        contents += `<tr><td>${ele.id}</td><td><a href="/pokemon/${ele.id}">${ele.name}</a></td></tr>\n`;
    })
    var html = `<html>\n<body>\n<table>${contents}</table>\n</body>\n</html>`;
    res.send(html);
});

app.get("/pokemon/:pokemon_id", function(req, res) {
    let _id = parseInt(req.params.pokemon_id);
    let result = _.findWhere(_DATA, { id: _id })
    if (!result) return res.send("Error: Pokemon not found");

    let contents = "";

    _.each(result, function(value, key) {
        if (typeof(value) === "string")
            contents += `<tr><td>${key}</td><td>${value}</td></tr>\n`;
        else
            contents += `<tr><td>${key}</td><td>${JSON.stringify(value)}</td></tr>\n`;
    });

    let html = `<html>\n<body>\n<table>${contents}</table>\n</body>\n</html>`;
    res.send(html);
});

app.get("/pokemon/image/:pokemon_id", function(req, res) {
    let _id = parseInt(req.params.pokemon_id);
    let result = _.findWhere(_DATA, { id: _id })
    if (!result) return res.send("Error: Pokemon not found");

    let contents = `<img src="${result.img}"\n`;
    let html = `<html>\n<body>\n${contents}</body>\n</html>`;
    res.send(html);
    
});

// API

app.get("/api/id/:pokemon_id", function(req, res) {
    // This endpoint has been completed for you.  
    var _id = parseInt(req.params.pokemon_id);
    var result = _.findWhere(_DATA, { id: _id })
    if (!result) return res.json({});
    res.json(result);
});

app.get("/api/evochain/:pokemon_name", function(req, res) {
    let _name = req.params.pokemon_name;
    let result = _.findWhere(_DATA, { name: _name });
    if (!result) return res.json([]);
    let retVal = [_name];

    let pre_env = result["prev_evolution"];
    let next_env = result["next_evolution"];

    if (pre_env) {
        _.each(pre_env, function(ele, index, list){
            retVal.push(ele.name);
        })
    }

    if (next_env) {
        _.each(next_env, function(ele, index, list){
            retVal.push(ele.name);
        })
    }

    retVal.sort();
    res.json(retVal);

});

app.get("/api/type/:type", function(req, res) {
    let _type = req.params.type;

    let pokTypes = _.filter(_DATA, function(pok) {
        let types = pok.type;
        return types.includes(_type);
    });

    if (pokTypes.length == 0) return res.json([]);

    let retVal = _.map(pokTypes, function(pok) {
        return pok.name;
    });

    res.json(retVal);
});

app.get("/api/type/:type/heaviest", function(req, res) {
    let _type = req.params.type;

    let pokTypes = _.filter(_DATA, function(pok) {
        let types = pok.type;
        return types.includes(_type);
    });

    if (pokTypes.length == 0) return res.json({});

    let weight = Number.MIN_VALUE;
    let name = "";

    _.each(pokTypes, function(ele, index, list) {

        let weightArr = ele.weight.split(" ");

        if (parseFloat(weightArr[0]) > weight) {
            name = ele.name;
            weight = parseFloat(weightArr[0]);
        }
    });

    let retVal = {"name" : name, "weight": weight};

    let x = [];

    res.json(retVal);    
});



app.post("/api/weakness/:pokemon_name/add/:weakness_name", function(req, res) {
    
    let _name = req.params.pokemon_name;
    let _weakness = req.params.weakness_name;
    let retVal = {};

    _.each(_DATA, function(ele, index, list) {
        if (ele.name === _name) {
            let arr = ele.weaknesses;

            if (!arr.includes(_weakness)) {
                arr.push(_weakness);
                ele.weaknesses = arr;
                retVal["name"] = ele.name;
                retVal["weaknesses"] = ele.weaknesses;
            } else {
                retVal["name"] = ele.name;
                retVal["weaknesses"] = ele.weaknesses;
            }
        }
    });

    pokeDataUtil.saveData(_DATA);

    // HINT: 
    // Use `pokeDataUtil.saveData(_DATA);`
    res.send(retVal);
});

app.delete("/api/weakness/:pokemon_name/remove/:weakness_name", function(req, res) {
    let _name = req.params.pokemon_name;
    let _weakness = req.params.weakness_name;
    let retVal = {};

    _.each(_DATA, function(ele, index, list) {
        if (ele.name === _name) {
            let arr = ele.weaknesses;

            if (arr.includes(_weakness)) {
                arr = _.filter(arr, function(val) {
                    return val !== _weakness;
                });

                ele.weaknesses = arr;
                retVal["name"] = ele.name;
                retVal["weaknesses"] = ele.weaknesses;
            } else {
                retVal["name"] = ele.name;
                retVal["weaknesses"] = ele.weaknesses;
            }
        }
    });

    pokeDataUtil.saveData(_DATA);

    // HINT: 
    // Use `pokeDataUtil.saveData(_DATA);`
    res.send(retVal);
});


// Start listening on port PORT
// app.listen(PORT, function() {
//     console.log('Server listening on port:', PORT);
// });

app.listen(process.env.PORT || 3000, function() {
    console.log('Listening!');
});

// DO NOT REMOVE (for testing purposes)
exports.PORT = PORT
