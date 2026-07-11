import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingFormClient from "@/components/BookingFormClient";

function InvalidAccess() {
  return (
    <>
      <Navbar />
      <section className="max-w-lg mx-auto px-6 py-24 text-center">
        <p className="text-4xl mb-4">🎫</p>
        <h1 className="font-display text-2xl font-semibold mb-3">
          Please select a package and room type first
        </h1>
        <p className="text-muted text-sm mb-6">
          This booking form needs a package and room type to show you accurate pricing — head
          back to our packages to pick one.
        </p>
        <Link
          href="/umrah"
          className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
        >
          Browse Umrah Packages
        </Link>
      </section>
      <Footer />
    </>
  );
}

export default async function BookingFormPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string; roomType?: string; adults?: string; children?: string; infants?: string }>;
}) {
  const params = await searchParams;
  const packageId = params.packageId;
  const roomTypeName = params.roomType;

  if (!packageId || !roomTypeName) {
    return <InvalidAccess />;
  }

  let pkg;
  try {
    pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { roomTypes: true },
    });
  } catch {
    pkg = null;
  }

  if (!pkg) return <InvalidAccess />;

  const roomType = pkg.roomTypes.find((rt) => rt.roomType === roomTypeName);
  if (!roomType) return <InvalidAccess />;

  // Clamp adults/infants from the URL to this room type's real limits —
  // the URL is just a UX carry-over from the previous page, never trusted
  // for anything that affects price. The server recomputes total on
  // submit regardless (see /api/bookings).
  const requestedAdults = Number(params.adults);
  const requestedChildren = Number(params.children);
  const requestedInfants = Number(params.infants);
  const adults = Number.isFinite(requestedAdults)
    ? Math.min(Math.max(requestedAdults, 1), roomType.maxAdults)
    : 1;
  const children = Number.isFinite(requestedChildren) ? Math.max(requestedChildren, 0) : 0;
  const infants = Number.isFinite(requestedInfants)
    ? Math.min(Math.max(requestedInfants, 0), roomType.maxInfants)
    : 0;

  return (
    <>
      <Navbar />
      <BookingFormClient
        pkg={{ id: pkg.id, slug: pkg.slug, name: pkg.name, category: pkg.category, imageUrl: pkg.imageUrl }}
        roomType={{
          roomType: roomType.roomType,
          pricePerPersonPkr: roomType.pricePerPersonPkr,
          pricePerChildPkr: roomType.pricePerChildPkr,
          pricePerInfantPkr: roomType.pricePerInfantPkr,
        }}
        adults={adults}
        children={children}
        infants={infants}
      />
      <Footer />
    </>
  );
}
