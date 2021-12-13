//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//mongoose connection
mongoose.connect("'mongodb://localhost:27017/todolistDB', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

//Creating a schema
const itemsSchema = {
    name: String
};
//Creating a model
const Item = mongoose.model("Item", itemsSchema);
//Creating documents
const item1 = new Item({ name: "Shopping" });
const item2 = new Item({ name: "Visiting" });
const defaultItems = [item1, item2];

// schema and model for parameter route
const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function(req, res) {


    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {

            //Saving multiple data
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("default-items Saved successfully to DB");
                }
            });
            res.render("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });

});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                // show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });

});


//Adding new item
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({ name: itemName });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Checked items successfully Deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server started successfully");
});
