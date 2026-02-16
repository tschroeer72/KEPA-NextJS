import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, cc, subject, message, type } = await request.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Keine Hauptempfänger angegeben" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST_ERROR,
      port: parseInt(process.env.EMAIL_PORT_ERROR || "587"),
      secure: process.env.EMAIL_PORT_ERROR === "465",
      auth: {
        user: process.env.EMAIL_USER_ERROR,
        pass: process.env.EMAIL_PASS_ERROR,
      },
    });

    let fullSubject = "KEPAVerwaltung ";
    if (type === "Fehler") fullSubject += "(FEHLER) ";
    if (type === "Info") fullSubject += "(INFO) ";
    if (type === "Wunsch") fullSubject += "(WUNSCH) ";
    fullSubject += subject.trim();

    const mailOptions = {
      from: process.env.EMAIL_SENDER_ERROR,
      to: to.join(", "),
      cc: cc && Array.isArray(cc) ? cc.join(", ") : undefined,
      subject: fullSubject,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "E-Mail erfolgreich versendet" });
  } catch (error: any) {
    console.error("Error sending error email:", error);
    return NextResponse.json({ error: error.message || "Fehler beim E-Mail-Versand" }, { status: 500 });
  }
}
