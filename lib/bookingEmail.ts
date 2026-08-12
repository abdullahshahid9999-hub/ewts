import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@eastwestpk.com";
const FROM = "East & West Travel <bookings@eastwestpk.com>";

export async function sendBookingEmails({
  bookingRef, packageName, customerName, customerEmail, customerPhone,
  adults, childrenWithBed, childrenWithoutBed, infants,
  roomType, totalPricePkr,
}: {
  bookingRef: string; packageName: string; customerName: string;
  customerEmail?: string; customerPhone?: string;
  adults: number; childrenWithBed: number; childrenWithoutBed: number; infants: number;
  roomType: string; totalPricePkr: number;
}) {
  const summary = `
    <b>Booking Ref:</b> ${bookingRef}<br/>
    <b>Package:</b> ${packageName}<br/>
    <b>Room Type:</b> ${roomType}<br/>
    <b>Travelers:</b> ${adults} Adults, ${childrenWithBed} Child(bed), ${childrenWithoutBed} Child(no bed), ${infants} Infants<br/>
    <b>Total:</b> PKR ${totalPricePkr.toLocaleString()}<br/>
    <b>Customer:</b> ${customerName} | ${customerPhone ?? ""} | ${customerEmail ?? ""}
  `;

  const promises = [];

  // Admin notification
  promises.push(
    resend.emails.send({
      from: FROM, to: ADMIN_EMAIL,
      subject: `🆕 New Booking — ${bookingRef} — ${packageName}`,
      html: `<h2>New Booking Received</h2>${summary}<br/><a href="https://eastwestpk.com/admin/bookings">View in Admin Panel →</a>`,
    }).catch(console.error)
  );

  // Customer confirmation
  if (customerEmail) {
    promises.push(
      resend.emails.send({
        from: FROM, to: customerEmail,
        subject: `Booking Confirmed — ${bookingRef} | East & West Travel`,
        html: `
          <h2>Assalam o Alaikum ${customerName},</h2>
          <p>Thank you for booking with East & West Travel Services. Your booking has been received and is under review.</p>
          ${summary}
          <p>Our team will contact you within 24 hours to confirm and process payment.</p>
          <p>Questions? WhatsApp us: <a href="https://wa.me/923336515349">+92 333 651 5349</a></p>
          <p>JazakAllah Khair,<br/>East & West Travel Services</p>
        `,
      }).catch(console.error)
    );
  }

  await Promise.all(promises);
}
