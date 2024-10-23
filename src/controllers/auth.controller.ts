import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import prisma from "../shared/prisma";
import apiError from "../utils/apiError";
import apiResponse from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { sendEmail } from "../utils/sendEmail";

//**  sign up user **//
const userSignUp = asyncHandler(async (req: Request, res: Response) => {
  const isUserExist = await prisma.user.findFirst({
    where: {
      email: req.body.email,
    },
  });
  if (isUserExist) {
    throw new apiError(httpStatus.BAD_REQUEST, "This email already exists");
  }

  const hashedPassword: string = await bcrypt.hash(req.body.password, 12);

  const userData = {
    email: req.body.email,
    password: hashedPassword,
    role: UserRole.user,
    name: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    companyName: req.body.companyName,
    designation: req.body.designation,
  };
  // console.log(userData);
  const result = await prisma.user.create({
    data: userData,
  });

  // // create verification token and send email
  // const token = jwt.sign(
  //   { email: result.email },
  //   config.jwt_access_secret as string,
  //   {
  //     expiresIn: "1days",
  //   }
  // );

  // // save verification token in database
  // await prisma.oTPVerification.upsert({
  //   where: { userId: result.id },
  //   update: {
  //     otp: token,
  //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  //   },
  //   create: {
  //     otp: token,
  //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  //     user: {
  //       connect: { id: result.id },
  //     },
  //   },
  // });

  // // email verify url
  // const EmailVerifyUrl = `${config.client_url}/verify-email?token=${token}`;

  // await sendEmail({
  //   to: result.email,
  //   subject: "Verify your Email",
  //   html: `<p><a href=${EmailVerifyUrl}>Click here  to verify your email</a></p>`,
  // });

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User created successfully. Please Login to your account",
  });
});

//**  Generate verification token and send email
const generateVerifyEmailToken = asyncHandler(
  async (req: Request, res: Response) => {
    // console.log(req.body);
    const { email } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
    }

    // create verification token and send email
    const token = jwt.sign(
      { email: req.body.email },
      config.jwt_access_secret as string,
      {
        expiresIn: "1days",
      }
    );

    // save verification token in database
    await prisma.oTPVerification.upsert({
      where: { userId: user.id },
      update: {
        otp: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      create: {
        otp: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        user: {
          connect: { id: user.id },
        },
      },
    });

    // email verify url
    const EmailVerifyUrl = `${config.client_url}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Verify your Email",
      html: `
      <html>

<body>


<p>Dear ${user.name},</p> <br/>
<p>To complete your registration and activate your account, please verify your email address.

Simply click the button below to verify your account:</p> <br/>

<p><a href=${EmailVerifyUrl}>Click here  to verify your email</a></p> <br/> 

<p>If the button doesn't work, you can also copy and paste the following link into your browser</p> <br/>

<p>${EmailVerifyUrl}</p> <br/> <br/>

<p>Best Regards,</p>
<p>Solar-ICT</p>
</body>
</html>

      `,
    });

    apiResponse(
      res,
      httpStatus.OK,
      "Verification token sent to your email. Please verify your email",
      ""
    );
  }
);

//**  Verify Email **//
const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  // console.log(token);

  // Verify the jwt token
  const decoded = jwt.verify(
    token as string,
    config.jwt_access_secret as string
  );

  if (!decoded) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }
  // find the token in database
  const verifyToken = await prisma.oTPVerification.findFirst({
    where: {
      userId: (decoded as JwtPayload).userId,
    },
  });

  if (!verifyToken) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  // Check if the token has expired
  if (verifyToken.expiresAt < new Date()) {
    throw new apiError(httpStatus.BAD_REQUEST, "Token has expired");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: (decoded as JwtPayload).email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
    },
  });

  // send response without password
  const userResponse = {
    ...result,
    password: undefined,
    id: undefined,
  };
  delete userResponse.password;
  delete userResponse.id;

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Email verified successfully",
    data: {
      name: userResponse.name,
      email: userResponse.email,
      role: userResponse.role,
      phone: userResponse.phone,
      companyName: userResponse.companyName,
      designation: userResponse.designation,
      avatar: userResponse.avatar,
      isVerified: userResponse.isVerified,
    },
  });

  // delete otp from database
  await prisma.oTPVerification.deleteMany({
    where: {
      userId: user.id,
    },
  });
});

//**  Login user **//
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // check if user exist
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
  }

  // check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new apiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  // check if user is verified
  // if (!user.isVerified) {
  //   throw new apiError(
  //     httpStatus.UNAUTHORIZED,
  //     "Please verify your email first"
  //   );
  // }

  // Generate OTP token and set expiration time (e.g., 10 minutes)
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set expiration to 10 minutes from now

  // Save or reset OTP for the user in the OTPVerification table
  await prisma.oTPVerification.upsert({
    where: {
      userId: user.id, // Check if an OTP already exists for this user
    },
    update: {
      otp,
      expiresAt,
    },
    create: {
      otp,
      expiresAt,
      user: {
        connect: { id: user.id },
      },
    },
  });

  // Send OTP to user's email
  await sendEmail({
    to: user.email,
    subject: "OTP Verification",
    html: `
        <html lang="en" >
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2">
      <div style="margin:30px auto;width:90%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
        </div>
        <p style="font-size:1.1em">Hi, ${user?.name}</p>
        <p>Use the following OTP to login. OTP is valid for 5 minutes.</p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
        <p style="font-size:0.9em;">Regards,<br />Solar-ICT</p>
        <hr style="border:none;border-top:1px solid #eee" />
      </div>
    </div>
    </body>
    </html>
        `,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `OTP sent successfully to your email. Please check your email.`,
  });
});

//**  Verify Login OTP **//
const verifyLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // check if user exist
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
  }

  // Find OTP verification record for the user
  const otpRecord = await prisma.oTPVerification.findUnique({
    where: { userId: user.id },
  });

  if (!otpRecord) {
    throw new apiError(
      httpStatus.BAD_REQUEST,
      "OTP not found or already verified"
    );
  }

  // Check if the OTP matches
  if (otpRecord.otp !== otp) {
    throw new apiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Check if the OTP is expired
  if (otpRecord.expiresAt < new Date()) {
    throw new apiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // OTP is valid; handle further actions (e.g., mark OTP as verified or delete it)
  await prisma.oTPVerification.delete({
    where: { userId: user.id },
  });

  // //? if all ok --> grant access. send access token, refresh token
  const jwtPayload = {
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // create jwt access token
  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as string, {
    expiresIn: config.jwt_access_expires_in as string,
  });

  // create jwt refresh token
  const refreshToken = jwt.sign(
    jwtPayload,
    config.jwt_refresh_secret as string,
    { expiresIn: config.jwt_refresh_expires_in as string }
  );

  // save refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
  });

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "logged in successfully. Please verify your account",
    token: accessToken,
    data: {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      companyName: user.companyName,
      designation: user.designation,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
});

//** forgot password **/
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // check if user exist
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new apiError(httpStatus.NOT_FOUND, "Email not registered");
  }

  // Generate random token and set expiration time (e.g., 10 minutes)
  const resetToken = crypto.randomBytes(32).toString("hex");
  // hash the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set expiration to 10 minutes from now

  // reset url
  const resetUrl = `${config.client_url}/reset-password/${resetToken}`;
  // console.log(resetUrl);

  //  save the token in the database and send it to the user's email
  await prisma.oTPVerification.upsert({
    where: { userId: user.id },
    create: {
      otp: hashedToken,
      expiresAt: expiresAt,
      userId: user.id,
    },
    update: {
      otp: hashedToken,
      expiresAt: expiresAt,
    },
  }),
    sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <html lang="en" >
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    <div style="font-family: Helvetica,Arial,sans-serif;overflow:auto;line-height:2">
      <div style="margin:30px auto;width:90%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
        </div>
        <p style="font-size:1.1em">Hi, ${user.name}</p>
        <p>
        <p>We have received a password reset request. Please use the below link to reset your password.</p>
        <a href=${resetUrl} target="_blank">Reset Password</a>
        </p>
          <p>This reset password link will be valid only for 10 minutes. </p>
        <p>Regards,<br />Solar-ICT</p>
        <hr style="border:none;border-top:1px solid #eee" />
      </div>
    </body>
    </html>
        `,
    }),
    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset link sent to email.",
    });
});

//** reset password **/
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token;
  const { password } = req.body;

  // Verify the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  // console.log("hashedToken", hashedToken);

  // Find the OTP record based on the hashed token
  const otpRecord = await prisma.oTPVerification.findFirst({
    where: { otp: hashedToken },
  });

  if (!otpRecord) {
    throw new apiError(httpStatus.BAD_REQUEST, "Invalid or expired token");
  }

  // Check if the token has expired
  if (otpRecord.expiresAt < new Date()) {
    throw new apiError(httpStatus.BAD_REQUEST, "Token has expired");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user's password
  await prisma.user.update({
    where: { id: otpRecord.userId }, // Assuming OTP record has a userId field
    data: { password: hashedPassword },
  });

  // Delete the OTP record after a successful password reset
  await prisma.oTPVerification.delete({
    where: { id: otpRecord.id }, // Deleting by the OTP record's ID
  });

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: httpStatus.OK,
    message: "Password reset successfully, Please login.",
  });
});

export const authController = {
  userSignUp,
  verifyEmail,
  loginUser,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  generateVerifyEmailToken,
};
