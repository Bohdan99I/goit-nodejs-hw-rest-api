const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { User } = require("../models/user");
const { HttpError, sendEmail } = require("../helpers");
const ctrlWrapper = require("../helpers/ctrlWrapper");
const { nanoid } = require("nanoid");

require("dotenv").config();

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "../", "public", "avatars");

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();

  const result = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = (email, verificationToken) => {
    return {
      to: email,
      subject: `Verify email`,
      html: `<p>Please click on link below</p>
        <p>
          <a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click verify email</a>
        </p>`,
      text: `Please click on link below\n
    ${BASE_URL}/api/users/verify/${verificationToken}
     `,
    };
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email,
      subscription: result.subscription,
      avatarURL,
    },
  });
};

const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(401, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.json({ message: "Verification successful" });
};

const returnVerifyUser = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(400, "missing required field email");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = (email, verificationToken) => {
    return {
      to: email,
      subject: `Verify email`,
      html: `<p>Please click on link below</p>
        <p>
          <a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click verify email</a>
        </p>`,
      text: `Please click on link below\n
    ${BASE_URL}/api/users/verify/${verificationToken}
     `,
    };
  };

  await sendEmail(verifyEmail);

  res.json({ massage: "Verification email sent" });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!user || !passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (user.verify !== true) {
    throw HttpError(401, "Please verify your email");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: {
      email,
      subscription: user.subscription,
    },
  });
};

const getCurrentUser = (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const logoutUser = async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById({ _id });

  if (!user) {
    throw HttpError(401);
  }
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json({ message: "Logout success" });
};

const updateStatusUser = async (req, res) => {
  const { _id } = req.user;
  const result = await User.findByIdAndUpdate(_id, req.body, { new: true });

  if (!result) {
    throw HttpError(404);
  }
  res.json(result);
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  await Jimp.read(tempUpload).then((img) =>
    img.resize(250, 250).write(resultUpload)
  );
  await fs.unlink(tempUpload);

  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

module.exports = {
  registerUser: ctrlWrapper(registerUser),
  verifyUser: ctrlWrapper(verifyUser),
  returnVerifyUser: ctrlWrapper(returnVerifyUser),
  loginUser: ctrlWrapper(loginUser),
  logoutUser: ctrlWrapper(logoutUser),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  updateStatusUser: ctrlWrapper(updateStatusUser),
  updateAvatar: ctrlWrapper(updateAvatar),
};
