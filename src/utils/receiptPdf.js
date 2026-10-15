import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { areaOf } from './bookingHelpers'
import { formatCurrency } from './formatCurrency'
import { formatDate, formatTime } from './formatDate'

// Makes a PDF receipt / access pass and opens the phone's share sheet (save, email, WhatsApp…).
// The web uses the browser's "print to PDF" instead.
export async function shareReceipt(booking) {
  const workspace = booking.workspace ?? {}
  const place = [workspace.location?.address, areaOf(workspace)].filter(Boolean).join(', ')
  // Text that came from users goes through escape() so it can't break the page
  const escape = (text = '') =>
    String(text).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    )

  const html = `
    <html><body style="font-family: -apple-system, Roboto, sans-serif; padding: 32px; color: #111827">
      <h1 style="color: #e2692c; margin: 0">SpaceShare</h1>
      <h2 style="margin-top: 24px">Booking ${booking.status === 'completed' ? 'completed' : 'confirmed'}</h2>
      <p><strong>${escape(workspace.name ?? 'Your workspace')}</strong><br>${escape(place)}</p>
      <p>${formatDate(booking.startTime)}<br>${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
      <p>Guests: ${booking.guestCount ?? 1}<br>Amount paid: ${formatCurrency(booking.amount)}</p>
      <p style="font-size: 20px; letter-spacing: 4px"><strong>${escape(booking.bookingCode)}</strong></p>
      ${booking.qrCode ? `<img src="${booking.qrCode}" style="width: 180px; height: 180px">` : ''}
      <p style="color: #4b5563">Show this code or the QR code at reception to check in.</p>
    </body></html>`

  const { uri } = await Print.printToFileAsync({ html })
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Your SpaceShare receipt',
    UTI: 'com.adobe.pdf',
  })
}
