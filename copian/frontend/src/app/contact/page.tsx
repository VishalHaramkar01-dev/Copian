"use client";

import React, { useState } from "react";
import StorefrontShell from "@/components/StorefrontShell";
import { useCms } from "@/components/CmsContext";
import { apiFetch } from "@/lib/api";

export default function ContactUsPage() {
  const { contact, metrics } = useCms();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("Bulk Purchase Quotation");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyName.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setErrorMsg("Please fill out all required (*) fields.");
      return;
    }
    setErrorMsg(null);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          inquiry_type: inquiryType,
          message: message.trim(),
        }),
      });
      setSubmitted(true);
      setFullName("");
      setCompanyName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send inquiry");
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-headline text-headline-lg text-light-on-surface">Contact Copian B2B Sales Desk</h1>
          <p className="font-body text-body-md text-light-on-surface-variant mt-1">
            Reach our wholesale, dealership, or technical compatibility team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6">
            <h2 className="font-headline text-headline-sm text-light-on-surface mb-4">Send a Business Message</h2>
            {submitted && (
              <div className="p-4 rounded bg-success-container text-on-success-container font-body text-body-md mb-4">
                Thank you. Your message has been routed to our B2B sales desk.
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded bg-light-error-container text-light-on-error-container font-body text-body-sm mb-4">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-body text-label-md text-light-on-surface">Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-body text-label-md text-light-on-surface">Company Name *</span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Business or dealership name"
                    className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="font-body text-label-md text-light-on-surface">Email *</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.in"
                    className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-body text-label-md text-light-on-surface">Phone *</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="font-body text-label-md text-light-on-surface">Inquiry Type</span>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                >
                  <option>Bulk Purchase Quotation</option>
                  <option>Authorized Dealership Application</option>
                  <option>Technical Compatibility Support</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-label-md text-light-on-surface">Message *</span>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your printer fleet, required SKUs, or target city..."
                  className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                />
              </label>
              <button
                type="submit"
                className="px-6 py-3 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container w-fit"
              >
                Send Inquiry
              </button>
            </form>
          </div>

          {/* Direct Details & Map */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
              <h2 className="font-headline text-headline-sm text-light-on-surface">Direct Channels</h2>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-light-primary mt-0.5" aria-hidden="true">call</span>
                <div>
                  <p className="font-body text-label-md text-light-on-surface">Sales &amp; Dispatch Desk</p>
                  <p className="font-mono text-mono-md text-light-on-surface-variant">
                    {contact.phone_primary}
                    {contact.phone_secondary ? ` · ${contact.phone_secondary}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-light-primary mt-0.5" aria-hidden="true">mail</span>
                <div>
                  <p className="font-body text-label-md text-light-on-surface">Email Quotations</p>
                  <p className="font-body text-body-md text-light-on-surface-variant">{contact.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-light-primary mt-0.5" aria-hidden="true">location_on</span>
                <div>
                  <p className="font-body text-label-md text-light-on-surface">{contact.company} HQ</p>
                  <p className="font-body text-body-md text-light-on-surface-variant">{contact.address}</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${contact.whatsapp_number || "919322593719"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-success text-on-success font-body text-label-lg mt-2"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-6 flex flex-col items-center justify-center text-center h-56 gap-2">
              <span className="material-symbols-outlined text-light-primary text-[36px]" aria-hidden="true">map</span>
              <p className="font-headline text-title-md text-light-on-surface">
                {contact.company} · Est. {contact.established_year}
              </p>
              <p className="font-body text-body-sm text-light-on-surface-variant">
                {metrics[0]?.value} · {metrics[1]?.value} {metrics[1]?.label} · {contact.office_hours}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </StorefrontShell>
  );
}
