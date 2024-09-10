const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const appPass = process.env.APP_PASS;
const mymail = process.env.EMAIL_ID;

app.use(cors());

app.use(express.json());

let userOtp = {};

const trans = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mymail,
    pass: appPass,
  },
});

const genotp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const extractName = (email) => {
  const localPart = email.split("@")[0];
  const nameParts = localPart.split(/[._]/);

  const firstName = nameParts[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
};

const sendopt = (email, otp) => {
  const name = extractName(email);

  const htmlcontent = testtemp(otp, name);
  const mailoption = {
    from: "harsh kavaiya",
    to: email,
    subject: "OTP Verification",
    html: htmlcontent,
  };
  console.log(`Sending email to: ${email}`);
  trans.sendMail(mailoption, (err, info) => {
    if (err) {
      console.log(`Error sending email :`, err);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};

app.get("/", (req, res) => {
  // res.send("Hello this is testing this server for Run currect");
  res.send(port + appPass + mymail);
});

app.post("/send-otp", (req, res) => {
  const { email } = req.body;
  const otp = genotp();
  if (!email) {
    res.status(400).json({ message: "email is requied!" });
  }

  // Set OTP and its expiry time (10 minutes from now)
  userOtp[email] = {
    otp: otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes in milliseconds
  };

  sendopt(email, otp);
  res.json({ message: "OTP sent to your email." });
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = userOtp[email];

  if (!record) {
    return res
      .status(400)
      .json({ message: "OTP not found. Please request a new one." });
  }

  // Check if OTP is expired
  if (Date.now() >= record.expiresAt) {
    delete userOtp[email];
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }

  // Validate OTP
  if (record.otp === otp) {
    delete userOtp[email]; // Remove OTP after successful validation
    res.json({ message: "OTP verified successfully." });
  } else {
    res.status(400).json({ message: "Invalid OTP. Please try again." });
  }
});

app.listen(port, () => {
  console.log(`Server running`);
});

const testtemp = (otp, name) =>
  `
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #007bff;
            padding: 20px;
            text-align: center;
            color: #ffffff;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .footer {
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        img {
            max-width: 8%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co/JncxvG2/Untitled-design-1-removebg-preview.png" alt="Company Logo">
            <h2>OTP Verification</h2>
        </div>
        <div class="content">
            <h3>Hello, ${name}!</h3>
            <p>Your OTP code is:</p>
            <div class="otp-code">${otp}</div>
            <p>Please use this code in 10 minutes to complete your verification.</p>
        </div>
        <div class="footer">
            <p>Thank you for using our services!</p>
        </div>
    </div>
</body>
</html>
`;
