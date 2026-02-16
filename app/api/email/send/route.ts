import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { recipients, subject, message, attachments } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Keine Empfänger angegeben" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: recipients.join(", "),
      subject: subject,
      text: message,
      attachments: attachments?.map((file: any) => ({
        filename: file.name,
        content: file.content,
        encoding: 'base64',
        contentType: file.contentType
      })) || [],
    };
    //console.log("MailOptions:", mailOptions);
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "E-Mail erfolgreich versendet" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: error.message || "Fehler beim E-Mail-Versand" }, { status: 500 });
  }
}
