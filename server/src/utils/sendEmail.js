const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a transactional email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER) {
    console.log(`\n📧  [DEV] Email to ${to}: ${subject}\n`);
    return { success: true, mode: "console" };
  }

  const mailOptions = {
    from: `"Raunak Opticals" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

/**
 * Order confirmation email template
 */
const orderConfirmationEmail = (order, user) => ({
  to: user.email,
  subject: `Order Confirmed — ${order.orderNumber} | Raunak Opticals`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px;">🕶️ Raunak Opticals</h1>
      </div>
      <div style="padding: 32px; background: #f9f9f9;">
        <h2 style="color: #1a1a2e;">Order Confirmed! 🎉</h2>
        <p>Hi ${user.name}, your order has been placed successfully.</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37;">
          <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin: 8px 0 0;"><strong>Total Amount:</strong> ₹${order.pricing.total}</p>
          <p style="margin: 8px 0 0;"><strong>Payment Method:</strong> ${order.paymentInfo.method.toUpperCase()}</p>
          <p style="margin: 8px 0 0;"><strong>Expected Delivery:</strong> ${
            order.expectedDelivery
              ? new Date(order.expectedDelivery).toLocaleDateString("en-IN")
              : "3–7 business days"
          }</p>
        </div>
        <p>You can track your order status by logging into your account at Raunak Opticals.</p>
        <p style="color: #666; font-size: 14px;">If you have any questions, contact us at support@raunakopticals.com</p>
      </div>
    </div>
  `,
  text: `Order ${order.orderNumber} confirmed! Total: ₹${order.pricing.total}. Thank you for shopping at Raunak Opticals.`,
});

module.exports = { sendEmail, orderConfirmationEmail };
