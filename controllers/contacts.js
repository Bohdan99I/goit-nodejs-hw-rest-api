const contacts = require("../models/contacts");
const { HttpError } = require("../helpers");
const { ctrlWrapper } = require("../helpers");

const listContacts = async (_, res) => {
  const result = await contacts.listContacts();
  res.json({
    status: "success",
    code: 200,
    data: {
      result,
    },
  });
};

const getContactById = async (req, res) => {
  const { contactId } = req.params;
  const result = await contacts.getContactById(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }
   res.json({
     status: "success",
     code: 200,
     data: {
       result,
     },
   });
};

const addContact = async (req, res) => {
  const result = await contacts.addContact(req.body);
  res.status(201).json({
    status: "success",
    code: 201,
    message: "contact added",
    data: {
      result,
    },
  });
};

const removeContact = async (req, res) => {
  const { contactId } = req.params;
  const result = await contacts.removeContact(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json({
    status: "success",
    code: 200,
    message: "contact deleted",
  });
};

const updateContact = async (req, res) => {
  const { contactId } = req.params;
  const result = await contacts.updateContact(contactId, req.body);
  if (!result) {
    throw HttpError(404, "Not found");
  }
   res.json({
     status: "success",
     code: 200,
     message: "contact updated",
     data: {
       result,
     },
   });
};

module.exports = {
  listContacts: ctrlWrapper(listContacts),
  getContactById: ctrlWrapper(getContactById),
  addContact: ctrlWrapper(addContact),
  removeContact: ctrlWrapper(removeContact),
  updateContact: ctrlWrapper(updateContact),
};
