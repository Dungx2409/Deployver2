const nodemailer = require('nodemailer');

// Cấu hình transporter với Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'danghiennguyen2@gmail.com', // Thay bằng email của bạn
        pass: 'cjve rxon vchx nflv'     // Thay bằng App Password (không phải mật khẩu Gmail thông thường)
    }
});

// Hàm gửi email thông báo (nội dung tương tự pushsafer)
function sendNotificationEmail(to, title, message) {
    const mailOptions = {
        from: 'danghiennguyen2@gmail.com', // Thay bằng email của bạn
        to: to,                      // Email người nhận
        subject: title,
        text: message
    };
    return transporter.sendMail(mailOptions);
}

module.exports = { sendNotificationEmail };
