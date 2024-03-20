import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "..//utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend i.e we can get data through postman like get request,post request
  // validation i.e user not send any empty username or email, or format is correct or not like these different validations
  // check if user already exists or not : we can check through username or email
  // check for images, avatars
  // if images,avatars available then upload on cloudinary, avatar
  // create user object - create entry in DB. Here,we will send data to mongoDB by making objects
  // remove password and refresh token field from response
  // check for user creation
  // return response

  // How to get user details . Deatils can be came from either form,json(then we used req.body) or URL
  const { fullname, email, username, password } = req.body;
  // console.log("email: ", email);

  // we can individual check each userdeatils like below
  // if (fullname == "") {
  //   throw new ApiError(400, "fullname is required");
  // }

  // OR we can check all userdetails like below by using "some" method
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // console.log(req.files);

  // multer gives us access to files and middlewares gives access to body
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
