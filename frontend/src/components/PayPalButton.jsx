import React from "react";

// Buton PayPal oficial (hosted button A8F6WTGW3RU94) — formular direct, fără script extern,
// deci trece prin CSP și nu adaugă nimic de încărcat
export default function PayPalButton({ testid = "paypal-button", label = "Pay Now" }) {
  return (
    <form
      action="https://www.paypal.com/ncp/payment/A8F6WTGW3RU94"
      method="post"
      target="_blank"
      rel="noreferrer"
      className="inline-grid justify-items-center content-start gap-2"
      data-testid={testid}
    >
      <button
        type="submit"
        data-testid={`${testid}-submit`}
        className="min-w-[186px] h-[42px] px-8 rounded font-bold text-base cursor-pointer transition-transform active:scale-[.97]"
        style={{ background: "#FFD140", color: "#000", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        {label}
      </button>
      <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="Carduri acceptate" className="h-[18px]" loading="lazy" />
      <span className="text-[11px] text-[var(--text-3)]">
        Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="PayPal" className="inline h-[14px] align-middle" loading="lazy" />
      </span>
    </form>
  );
}
