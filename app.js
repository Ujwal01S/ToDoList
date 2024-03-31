

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = new mongoose.Schema({
  name:String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name:"Welcome to you todolist"
});

const item2 = new Item({
  name:"Hit the + button to add more list"
});

const item3 = new Item({
  name:"<-- Hit this to delete the item"
});

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("list", listSchema);








app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
  

    if(foundItems.length === 0){
//Inorder to remove inserting default items many time in find we put logic to check if DB is empty or not.
      Item.insertMany(defaultItem, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully inserted defaultItems to DB.");
        }
      });

      res.redirect("/");

    }else{

      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
 
  });
});

//when new route is made app.get below will be trigered

app.get("/:customListName", function(req, res){
//code below is used to get the name of new route the website user inputs
  const customName = _.capitalize(req.params.customListName);
  List.findOne({name:customName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customName,
          items: defaultItem 
        });
      
        list.save();
        res.redirect("/" + customName);
      }else{
        res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
      }

    }
  });
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


  
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item!");
        res.redirect("/");
      }
    });

  }else{
    Item.findOneAndUpdate({name:listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundItem){
      if(!err){
        res.redirect("/" + listName);
        //this listName is set by me to have same value as customListName
      }
    });
  }

});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
