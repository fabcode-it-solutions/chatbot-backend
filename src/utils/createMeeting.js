import axios from "axios";
import dotenv from "dotenv";
import { sendEmail } from "./sendEmail.js";
dotenv.config();

export const createMeeting = async ({ date, startTime, email, purpose }) => {  
  const result = await createZoomMeeting({
    date,
    startTime,
    purpose
  });
  if(result.error){
    return "Not Created"
  }
  else{
     await sendEmail({
       to: email,
       subject: `Zoom meeting with The Fabcode`,
       html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <tr>
              <td style="font-size: 20px; font-weight: bold; padding-bottom: 10px;">📅 Meeting Confirmed</td>
            </tr>
            <tr>
              <td style="font-size: 16px; padding-bottom: 10px;">
                Hi there,
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; padding-bottom: 15px;">
                We're pleased to inform you that your meeting has been scheduled successfully.
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px;">
                <ul style="padding-left: 20px; margin-top: 0;">
                  <li><strong>📍 Purpose:</strong> Fabcode Meeting</li>
                  <li><strong>📅 Date:</strong> ${date}</li>
                  <li><strong>⏰ Time:</strong> ${startTime}</li>
                  <li><strong>🔗 Link:</strong> <a href="${result}" target="_blank" style="color: #2a27da;">Join Meeting</a></li>
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 20px; padding-bottom: 20px;">
                <a href="${result}" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #2a27da; color: #ffffff; text-decoration: none; border-radius: 5px;">Join Meeting</a>
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #888888; padding-top: 20px;">
                If you didn’t request this meeting, please ignore this email.<br>
                — The Fabcode Team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
        `,
     });
      await sendEmail({
       to: process.env.ADMIN_MAIL,
       subject: `Zoom meeting with: (${email})`,
       html: `
     <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px;">
            <tr>
              <td style="font-size: 20px; font-weight: bold; padding-bottom: 10px;">📢 New Meeting Scheduled</td>
            </tr>
            <tr>
              <td style="font-size: 16px; padding-bottom: 10px;">
                Hello Admin,
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; padding-bottom: 15px;">
                A new meeting has been scheduled by a user. Below are the details:
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px;">
                <ul style="padding-left: 20px; margin-top: 0;">
                  <li><strong>👤 User Email:</strong> ${email}</li>
                 <li><strong>📍 Purpose:</strong> Fabcode Meeting</li>
                  <li><strong>📅 Date:</strong> ${date}</li>
                  <li><strong>⏰ Time:</strong> ${startTime}</li>
                  <li><strong>🔗 Link:</strong> <a href="${result}" target="_blank" style="color: #2a27da;">Join Meeting</a></li>
                </ul>
              </td>
            </tr>
               <tr>
              <td style="padding-top: 20px; padding-bottom: 20px;">
                <a href="${result}" target="_blank" style="display: inline-block; padding: 12px 20px; background-color: #2a27da; color: #ffffff; text-decoration: none; border-radius: 5px;">Join Meeting</a>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #888888; padding-top: 20px;">
                — This is an automated notification from your system.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
        `,
     });
      return result;
  }
};

async function getZoomAccessToken() {    
  try {
    const res = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "account_credentials",
        account_id: process.env.ACCOUNT_ID,
      }),
      {
        auth: {
          username: process.env.ZOOM_USERNAME,
          password: process.env.PASSWORD,
        },
      }
    );

    return res.data.access_token;
  } catch (err) {
    console.error("❌ Failed to get token:", err.response?.data || err.message);
    throw err;
  }
}

async function createZoomMeeting({ date, startTime, purpose }) {
  try {
    const token = await getZoomAccessToken();
    const startDateTime = new Date(`${date}T${startTime}:00+05:30`);
    const meetingRes = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: 'Fabcode Meeting',
        type: 2,
        start_time: startDateTime.toISOString(),
        duration: 30,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return meetingRes.data.join_url;
  } catch (err) {
    console.error(
      "❌ Failed to create meeting:",
      err.response?.data || err.message
    );
  }
}
