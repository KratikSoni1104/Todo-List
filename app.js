//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery" , true);
mongoose.connect("mongodb://127.0.0.1/todoListDB");

const itemSchema = new mongoose.Schema({
  name : String
});

const listSchema = new mongoose.Schema({
  name :String,
  item : [itemSchema]
});

const List = mongoose.model("List" , listSchema);

const Item = mongoose.model("Item" , itemSchema);

const item1 = new Item({name : "Welcome to todoList"});
const item2 = new Item({name : "Hit the + to add new items to the list"});
const item3 = new Item({name : "<-- Hit this to delete the items"});

const defaultItems = [item1 , item2 , item3];




app.get("/", function(req, res) {

  Item.find({} , function(err , foundItems) {

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems , function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("successfully inserted");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

app.get("/:customListName" , function(req , res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name : customListName} , function(err , foundList) {

    if(!err) {
      if(!foundList) {
        //create the list

        const list = new List({
          name : customListName,
          item : defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list" , {listTitle: customListName, newListItems: foundList.item});
      }
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name : itemName
  });

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName} , function(err , foundList) {
      foundList.item.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


});

app.post("/delete" , function(req , res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.list;

  if(listName === "Today") {
    Item.findByIdAndRemove( checkedItemId , function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("deleted");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name : listName} , {$pull :{item : {_id : checkedItemId }}} , function(err) {
      if(!err) {
        res.redirect("/" + listName);
      }
    } );
  }

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
