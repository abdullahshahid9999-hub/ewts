"use client";
import { useState } from "react";

const SECTIONS = [
  {
    title: "Visit Visa Requirements & Documents",
    content: `The documents required for a tourist visa application vary by destination, but most visit visa applications require: valid passport with at least 6 months validity, recent passport-size photographs, bank statement (last 3-6 months), confirmed return flight booking, hotel reservation or accommodation proof, and CNIC copy. Some countries may require additional documents depending on visa policies. We guide you through exactly what's needed for your specific destination.`,
    table: [
      { country: "UAE Visit Visa", time: "3-5 working days" },
      { country: "Turkey Tourist Visa", time: "7-10 working days" },
      { country: "UK Visit Visa", time: "10-15 working days" },
      { country: "Schengen Visa", time: "15-30 working days" },
    ],
  },
  {
    title: "Popular Visit Visa Destinations from Pakistan",
    content: `Many Pakistani travelers apply for visit visas for tourism and short holidays. Popular destinations include UAE (Dubai), Saudi Arabia, Malaysia, Thailand, Turkey, UK, Schengen countries, Canada, and Bahrain. Dubai remains the most searched destination for Pakistani travelers, with high demand for 30-day and 60-day visit visa options. East & West Travel Services handles all these destinations with a 95% approval rate.`,
    list: ["Dubai visit visa (UAE)", "Saudi Arabia visit visa", "Malaysia tourist visa", "Thailand tourist visa", "Turkey tourist visa", "UK visit visa", "Schengen visit visa", "Canada visit visa"],
  },
];

export default function VisaPageClient() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  return (
    <section className="max-w-4xl mx-auto px-4 pb-10 space-y-4">
      {SECTIONS.map((s, i) => {
        const open = expanded[i];
        return (
          <div key={i} className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-gray-900 mb-2">{s.title}</h2>
            <p className={`text-sm text-gray-600 leading-relaxed ${open ? "" : "line-clamp-3"}`}>{s.content}</p>
            {s.list && open && (
              <ul className="mt-3 space-y-1">
                {s.list.map((item) => <li key={item} className="text-sm text-amber-700 hover:underline cursor-pointer">• {item}</li>)}
              </ul>
            )}
            {s.table && open && (
              <table className="mt-3 w-full text-sm border-collapse">
                <tbody>
                  {s.table.map((r) => (
                    <tr key={r.country} className="border-t border-gray-100">
                      <td className="py-2 font-medium text-gray-800 w-1/2">{r.country}</td>
                      <td className="py-2 text-gray-500">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setExpanded(e => ({ ...e, [i]: !open }))}
              className="mt-2 text-sm font-semibold text-amber-700 hover:underline">
              {open ? "Read Less" : "Read More"}
            </button>
          </div>
        );
      })}
    </section>
  );
}
