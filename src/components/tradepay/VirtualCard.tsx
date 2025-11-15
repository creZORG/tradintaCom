
'use client';

import React, { useEffect, useRef } from 'react';
import './virtual-card.css';

export function VirtualCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Example data - in a real app, this would come from props or state
    const data = {
      bank: "TradePay",
      last4: "1234",
      holder: "MARK ALLAN",
      expiry: "11/27"
    };

    const bankNameEl = card.querySelector('#bankName');
    const cardHolderEl = card.querySelector('#cardHolder');
    const expiryEl = card.querySelector('#expiry');
    const cardNumberEl = card.querySelector('#cardNumber');

    if (bankNameEl) bankNameEl.textContent = data.bank;
    if (cardHolderEl) cardHolderEl.textContent = data.holder;
    if (expiryEl) expiryEl.textContent = data.expiry;
    if (cardNumberEl) cardNumberEl.textContent = `•••• •••• •••• ${data.last4}`;

    const handleMouseMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${px * 12}deg) rotateX(${-py * 8}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = '';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="scene">
      <div className="card" id="card" ref={cardRef}>
        <div className="card-inner">
          <div className="side front">
            <div className="top-row">
              <div className="bank" id="bankName">MyBank</div>
              <div className="chip" aria-hidden="true"></div>
            </div>

            <div>
              <div className="number" id="cardNumber">•••• •••• •••• 1234</div>
              <div className="meta">
                <div id="cardHolder">JOHN DOE</div>
                <div id="expiry">09/27</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.85 }}>
              <div>VIRTUAL • USD</div>
              <div style={{ textTransform: 'uppercase', fontWeight: 600 }}>✔ Active</div>
            </div>
          </div>

          <div className="side back">
            <div style={{ height: '10px' }}></div>
            <div className="magstripe"></div>
            <div className="cvv">Signature ••••••••• <strong style={{ float: 'right' }}>CVV  •••</strong></div>
          </div>

          <div className="sheen" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  );
}
