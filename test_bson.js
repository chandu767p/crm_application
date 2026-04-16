const { ObjectId } = require('mongoose').Types;
const obj = { _id: new ObjectId(), nested: { id: new ObjectId() } };
console.log(JSON.stringify(obj));
