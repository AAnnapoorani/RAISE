const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    arrival_date: {
        type: Date,
        default: Date.now
    },
    asset_name: String,
    purchase_id: String,
    quantity: Number,
    seller_id: String
});

module.exports = mongoose.model("purchases", purchaseSchema);


