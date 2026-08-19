export default function Home() {
  return (
    <>
      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="logo">
            vonk<span>zy</span>
          </div>
          <a className="nav-cta" href="#pricing">
            Start free trial
          </a>
        </div>
      </nav>

      <header className="hero wrap">
        <div>
          <p className="eyebrow">For US roofing companies</p>
          <h1 className="h1">
            Every missed call is a <em>lost job.</em>
            <br />
            Not anymore.
          </h1>
          <p className="sub">
            Vonkzy texts back the moment a lead comes in — a missed call
            or a website form — asks the right questions, and books the
            inspection. Before the homeowner calls the next roofer.
          </p>
          <div className="hero-actions">
            <a className="btn-primary" href="#pricing">
              Start your free trial
            </a>
            <a className="btn-ghost" href="#how">
              See how it works
            </a>
          </div>
        </div>

        <div className="phone" aria-hidden="true">
          <div className="phone-screen">
            <p className="phone-time">2:41 PM</p>
            <div className="bubble missed">Missed call — (555) 019-4482</div>
            <div className="bubble out">
              Sorry we missed your call from Coastal Roofing! Reply YES if
              you'd like help getting a quote.
            </div>
            <div className="bubble in">Yes please</div>
            <div className="bubble out2">
              Got it. Is this for a repair, or a full roof replacement?
            </div>
            <div className="bubble booked">
              ✓ Inspection booked — Thursday, 10:00 AM
            </div>
          </div>
        </div>
      </header>

      <div className="courses" role="presentation" />

      <section className="stats wrap">
        <div>
          <div className="stat-num">100x</div>
          <div className="stat-label">
            more likely to qualify a lead answered in 5 minutes vs. 30
          </div>
        </div>
        <div>
          <div className="stat-num">$50–200</div>
          <div className="stat-label">what you already pay per lead</div>
        </div>
        <div>
          <div className="stat-num">~20¢</div>
          <div className="stat-label">
            what it costs to make sure that lead doesn't disappear
          </div>
        </div>
      </section>

      <section className="section section-light" id="how">
        <div className="wrap">
          <p className="eyebrow eyebrow-dark">How it works</p>
          <h2 className="h2">Four steps. No one on your team touches it.</h2>
          <p className="section-sub">
            Built so a missed call and a submitted form are handled
            differently — on purpose. See the full reasoning in the docs
            if you're curious; here's what it looks like from your side.
          </p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3 className="step-title">Lead comes in</h3>
              <p className="step-text">
                A call goes unanswered, or someone fills out your website
                form. Vonkzy knows instantly — no app to check.
              </p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3 className="step-title">Vonkzy replies</h3>
              <p className="step-text">
                Within seconds. Asks a few real questions — repair or
                replacement, roof age, storm damage — not a generic bot
                script.
              </p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3 className="step-title">Emergency? It stops.</h3>
              <p className="step-text">
                Anything that sounds urgent skips the flow entirely and
                texts you directly. No guessing, ever.
              </p>
            </div>
            <div className="step">
              <div className="step-num">04</div>
              <h3 className="step-title">Inspection booked</h3>
              <p className="step-text">
                Straight onto your calendar. You show up to a scheduled
                visit, not a cold lead you have to chase down.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="courses" role="presentation" />

      <section className="section" id="pricing">
        <div className="wrap">
          <p className="eyebrow">Pricing</p>
          <h2 className="h2">One flat price. No per-lead math to trust.</h2>
          <p className="section-sub">
            Every plan includes the full qualifying flow, calendar
            booking, and urgent-alert texts. Higher tiers add more
            volume and deeper integration.
          </p>
          <div className="pricing-grid">
            <div className="price-card">
              <p className="price-name">Starter</p>
              <p className="price-amount">
                $199<span>/month</span>
              </p>
              <p className="price-leads">Up to 75 leads/month</p>
              <ul className="price-list">
                <li>Instant text-back</li>
                <li>Core qualifying questions</li>
                <li>Calendar booking</li>
                <li>Urgent alerts</li>
              </ul>
            </div>
            <div className="price-card featured">
              <p className="price-name">Pro</p>
              <p className="price-amount">
                $399<span>/month</span>
              </p>
              <p className="price-leads">Up to 250 leads/month</p>
              <ul className="price-list">
                <li>Everything in Starter</li>
                <li>Full storm/insurance flow</li>
                <li>CRM export</li>
                <li>Dollars-recovered dashboard</li>
              </ul>
            </div>
            <div className="price-card">
              <p className="price-name">Growth</p>
              <p className="price-amount">
                $699<span>/month</span>
              </p>
              <p className="price-leads">Unlimited leads</p>
              <ul className="price-list">
                <li>Everything in Pro</li>
                <li>Multiple locations</li>
                <li>Custom questions per location</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>
          <p className="founding-note">
            First 10 companies: $99/month, locked in for as long as
            you're subscribed.
          </p>
        </div>
      </section>

      <div className="courses" role="presentation" />

      <section className="footer-cta wrap">
        <p className="eyebrow" style={{ textAlign: "center" }}>
          Free for 14 days
        </p>
        <h2 className="h2">Stop losing jobs you already paid for.</h2>
        <a className="btn-primary" href="#pricing">
          Start your free trial
        </a>
      </section>

      <footer className="footer wrap">
        vonkzy — built for roofing companies, not built by them, yet.
      </footer>
    </>
  );
}
