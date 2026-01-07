
export const ORDER_CONFIRMATION_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Confirmed</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#51B353; padding:24px; text-align:center; ">
              <img  
              src="cid:radstarlogo" 
                alt="Company Logo" 
                style="height:56px; display:block; margin:0 auto; border-radius:56px;"
              />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px; color:#333333;">

              <h1 style="margin:0 0 12px; font-size:24px; font-weight:bold; color:#1f2933;">
                🎉 Order Confirmed!
              </h1>

              <p style="margin:0 0 20px; font-size:16px; line-height:1.6;">
                Hi <strong>{{customer_name}}</strong>,
              </p>

              <p style="margin:0 0 24px; font-size:16px; line-height:1.6;">
                Thank you for your purchase! Your order has been successfully placed and is now being processed.
              </p>

              <!-- Order Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:28px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#6b7280;">Order Number</p>
                    <p style="margin:0; font-size:16px; font-weight:bold;">{{order_number}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px 16px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#6b7280;">Order Date</p>
                    <p style="margin:0; font-size:16px;">{{order_date}}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="padding:10px 0 30px;">
                    <a 
                      href="{{order_url}}" 
                      style="
                        background-color:#51B353;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        font-size:16px;
                        font-weight:bold;
                        border-radius:6px;
                        display:inline-block;
                      ">
                      View Your Order
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">
                If you have any questions, feel free to reply to this email or contact our support team.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#9ca3af;">
              © {{current_year}}. Rad Star Trading. All rights reserved.<br>
              Hyderabad, India
            </td>
          </tr>

        </table>
        <!-- End Container -->

      </td>
    </tr>
  </table>

</body>
</html>
`;

export const FORGOT_PASSWORD_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#51B353; padding:24px; text-align:center; ">
              <img  
              src="cid:radstarlogo" 
                alt="Company Logo" 
                style="height:56px; display:block; margin:0 auto; border-radius:56px;"
              />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px; color:#333333;">

              <h1 style="margin:0 0 12px; font-size:24px; font-weight:bold; color:#1f2933;">
                Reset Your Password
              </h1>

              <p style="margin:0 0 20px; font-size:16px; line-height:1.6;">
                Hi there,
              </p>

              <p style="margin:0 0 24px; font-size:16px; line-height:1.6;">
                We received a request to reset your password. Click the button below to create a new one.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="padding:10px 0 30px;">
                    <a 
                      href="{{reset_link}}" 
                      style="
                        background-color:#51B353;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        font-size:16px;
                        font-weight:bold;
                        border-radius:6px;
                        display:inline-block;
                      ">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">
                If you didn't request this, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#9ca3af;">
              © {{current_year}}. Rad Star Trading. All rights reserved.<br>
              Hyderabad, India
            </td>
          </tr>

        </table>
        <!-- End Container -->

      </td>
    </tr>
  </table>

</body>
</html>
`;
