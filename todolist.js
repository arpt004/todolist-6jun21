const express = require("express");
const bodyparser = require("body-parser");
const date = require(__dirname+"/date.js")
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true}));
app.set("view engine", "ejs");
mongoose.set('useFindAndModify', false);

//to connect to mongoose
//const url = "mongodb://localhost:27017/todolistDB"  --> offline
// Online
const url = "mongodb+srv://admin-todolist:todolist@cluster0.jv4fj.mongodb.net/todolistDB"
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true} );

//Schema and model for Item table
const itemSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemSchema);

//Schema and model for lists table
const listSchema = {
    name : String,
    items : [itemSchema]
}
const List = mongoose.model("List", listSchema);

// items
const item1 = new Item({
    name : "Welcome to  your todolist"
});

// const item2 = new Item({
//     name :" Hit the + button to add new item"
// });
// const item3 = new Item({
//     name :" <-- Hit this to delete an item"
// });

const defaultItems = [item1];


// to handle get request for home page and to display home page
app.get("/", function(req, res){
    day = date.getDate();
    Item.find({}, (err, foundItems)=>{
        if(err){
            console.log(err)
        }else{
            if(foundItems.length<=0){
                Item.insertMany(defaultItems, function(err){
                    if(err){
                        console.log(err)
                    }else{
                        console.log("Inserted default Items Successfully")
                    }
                })
            }
            res.render("list", {listTitle : "Today "+day , newItem : foundItems});
        }
    })    
})


// to handle get request for home page and to handle input data
app.post("/", function(req, res){

    let reqItem = req.body.item;
    let list = req.body.list;
    
    let itemInsert = new Item({
        name: reqItem
    })
    let s = list.slice(0,5);
    
    if(s === "Today"){
        itemInsert.save() 
        res.redirect("/")
    }else{
        List.findOne({name: list}, function(err, foundResult){
            if(!err){
                foundResult.items.push(itemInsert);
                foundResult.save();
                res.redirect("/"+list);
            }else{
                console.log(err)
            }
        })
    }    
})

// to handle get request for different-different list and to handle display for all of the list
app.get("/:customListName", function(req, res){
    let day = _.capitalize(req.params.customListName);

    if(day != "Index"){
        List.findOne({name:day}, function(err, foundList){
            if(err){
                console.log(err)
            }else{
                if(foundList){
                    res.render("list", {listTitle : day , newItem : foundList.items});
                }else{
                    let newList = new List({
                        name: day,
                        items: defaultItems
                    });
                    newList.save()                    
                    res.redirect("/"+day)
                }
            }
        }) 
    }else{
        handleIndex(req, res);
    }
})

// to handle post delete request from all pages
app.post("/delete", function(req, res){
    let itemDeleteId = req.body.tick
    let findList = req.body.hiddenInput
    let s = findList.slice(0,5);
    if(s === "Today")
    {    Item.findByIdAndRemove(itemDeleteId, function(err){
            if(err){
                console.log(err)
            }else{
                console.log(itemDeleteId+" deleted")
                res.redirect("/")
            }
        });  
    }else{
        // findOneAndUpdate ({findOne}, {update} , {callBack})
        List.findOneAndUpdate({name: findList}, // In list table name is lists and items is array
            {$pull : {items : {_id:itemDeleteId}}}, //to delete one item from array using id,here we pull from items array
            function(err, foundToDelete){
                if(!err){
                    res.redirect("/"+findList);
                }
            }
        )
    }
});

// to list down all the lists like an index
function handleIndex(req, res){
    const indexItem = []
    List.find({}, function(err, result){
        if(!err){
            result.forEach(function(i){
                indexItem.push(i)
            })
        }
        res.render('index', {listTitle: "index", indexName : indexItem})
    })
}

app.post("/delete/index", function(req, res){
    let listDeleteId = req.body.tick

    List.deleteOne({_id: listDeleteId}, function(err){
        if (err){
            console.log(err);
        }else{
            res.redirect("/index")
        }
    })
})


// to start the server
let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}
app.listen(port, function(){
    console.log("Server has started successfully")
})


// our servers are :
// Node (todolist.js) --> http://localhost:3000/
// Db (mongoDb) --> mongodb://localhost:27017/todolistDB

//online server
// Db Path --> mongo "mongodb+srv://cluster0.jv4fj.mongodb.net/myFirstDatabase" --username admin-todolist
// Url --> mongodb+srv://admin-todolist:todolist@cluster0.jv4fj.mongodb.net/
// for deploying NodeJs we will use heroku --> heroku login -i
// 