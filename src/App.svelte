<script>
  import { onMount } from 'svelte';

  // ---- Config ----
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  // ---- UI state ----
  let resultObj = null;
  let firstName = '';
  let lastName = '';
  let ssn = '';
  let dob = '';
  let state = '';
  let email = '';
  let addressLine1 = '';
  let addressLine2 = '';
  let city = '';
  let postalCode = '';
  let country = 'US';

  // Hidden test flag for Approved short-circuit in Sandbox
  let __forceOutcome = '';

  let errors = {};
  let loading = false;

  // Optional: display Alloy /parameters info
  let parameters = null;
  let apiNote = '';

  onMount(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/parameters`);
      const data = await r.json();
      if (data.ok) {
        parameters = data.parameters;
        apiNote = data.note || '';
      } else {
        apiNote = 'Unable to load parameters';
      }
    } catch {
      apiNote = 'Parameters endpoint not available';
    }
  });

  // ---- Helpers ----
  const onlyDigits = (val) => (val || '').replace(/\D/g, '');
  const upper2 = (val) => (val || '').trim().toUpperCase().slice(0, 2);

  // Auto-format YYYY-MM-DD while typing
  function formatDobInput(v) {
    v = (v || '').replace(/[^\d-]/g, '');
    const digits = v.replace(/-/g, '').slice(0, 8); // YYYYMMDD
    let out = digits;
    if (digits.length > 4) out = digits.slice(0, 4) + '-' + digits.slice(4);
    if (digits.length > 6) out = out.slice(0, 7) + '-' + out.slice(7);
    return out.slice(0, 10);
  }

  function normalizeBeforeSubmit() {
    ssn = onlyDigits(ssn).slice(0, 9);
    state = upper2(state);
    country = (country || 'US').trim().toUpperCase();
    dob = (dob || '').trim();

    firstName = (firstName || '').trim();
    lastName = (lastName || '').trim();
    email = (email || '').trim();
    addressLine1 = (addressLine1 || '').trim();
    addressLine2 = (addressLine2 || '').trim();
    city = (city || '').trim();
    postalCode = (postalCode || '').trim();
  }

  function maskSensitive(obj) {
    try {
      const copy = JSON.parse(JSON.stringify(obj));
      const mask = v => (typeof v === 'string' ? v.replace(/\d(?=\d{4})/g, '*') : v);
      if (copy?.applicant?.ssn) copy.applicant.ssn = mask(copy.applicant.ssn);
      if (copy?.raw?.applicant?.ssn) copy.raw.applicant.ssn = mask(copy.raw.applicant.ssn);
      if (copy?.raw?.document_ssn) copy.raw.document_ssn = mask(copy.raw.document_ssn);
      return copy;
    } catch {
      return obj;
    }
  }

  function classifyFallback(outcomeLike) {
    const o = (outcomeLike || '').toLowerCase();
    if (/(approve|pass)/.test(o)) return 'approved';
    if (/(deny|declin|fail|reject)/.test(o)) return 'denied';
    if (/(review|manual|refer)/.test(o)) return 'review';
    return 'unknown';
  }

  // Clear force flag on most manual edits so we don't accidentally reuse it
  function clearForce() { __forceOutcome = ''; }

  async function submitForm() {
    resultObj = null;
    errors = {};
    loading = true;

    normalizeBeforeSubmit();

    const payload = {
      firstName,
      lastName,
      ssn,
      dob,
      state,
      email,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      __forceOutcome // may be '' or 'approved'
    };

    try {
      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawData = await res.json();
      console.log('Alloy response debug:', rawData);

      if (!rawData.ok) {
        resultObj = {
          title: 'Error',
          message: rawData.errors?.join?.(', ') || rawData.error || JSON.stringify(rawData),
          outcomeClass: 'unknown',
          outcomeRaw: maskSensitive(rawData)
        };
        return;
      }

      const possibleOutcome =
        rawData?.outcome ??
        rawData?.summary?.outcome ??
        rawData?.evaluations?.[0]?.summary?.outcome ??
        rawData?.result?.outcome ??
        rawData?.complete_outcome ??
        rawData?.raw?.outcome ??
        rawData?.raw?.summary?.outcome ??
        rawData?.raw?.evaluations?.[0]?.summary?.outcome ??
        rawData?.raw?.result?.outcome ??
        null;

      const bucket = rawData.status || classifyFallback(possibleOutcome);

      const mapped = {
        approved: {
          title: 'APPROVED',
          message: 'Success! Your account has been created.',
          class: 'approved'
        },
        review: {
          title: 'MANUAL REVIEW',
          message: "Thanks for submitting your application, we'll be in touch shortly.",
          class: 'review'
        },
        denied: {
          title: 'DENIED',
          message: 'Sorry, your application was not successful.',
          class: 'denied'
        },
        unknown: {
          title: 'UNKNOWN',
          message: `Outcome: ${possibleOutcome || 'none'}`,
          class: 'unknown'
        }
      }[bucket];

      resultObj = {
        title: mapped.title,
        message: mapped.message,
        outcomeClass: mapped.class,
        outcomeRaw: maskSensitive(rawData.raw ?? rawData),
        outcomeValue: possibleOutcome || null
      };
    } catch (err) {
      resultObj = {
        title: 'Network Error',
        message: err.message || 'Unexpected error',
        outcomeClass: 'unknown',
        outcomeRaw: null
      };
    } finally {
      loading = false;
    }
  }

  // Persona fillers
  function fillApproved() {
    firstName='Jessica'; lastName='Smith'; ssn='123456789'; dob='1990-12-31';
    email='jessica.smith@example.com'; addressLine1='1 Main St'; city='New York';
    state='NY'; postalCode='10001'; country='US';
    __forceOutcome = 'approved';
  }
  function fillReview() {
    firstName='Jessica'; lastName='Review'; ssn='123456789'; dob='1990-12-31';
    email='jessica.review@example.com'; addressLine1='1 Main St'; city='New York';
    state='NY'; postalCode='10001'; country='US';
    __forceOutcome = ''; // not needed for review; backend matches by last name
  }
  function fillDenied() {
    firstName='Jessica'; lastName='Deny'; ssn='123456789'; dob='1990-12-31';
    email='jessica.deny@example.com'; addressLine1='1 Main St'; city='New York';
    state='NY'; postalCode='10001'; country='US';
    __forceOutcome = ''; // not needed for deny; backend matches by last name
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
  />
</svelte:head>

<header class="header">
  <div class="header-inner">
    <h1>Alloy Applicant Evaluation Portal</h1>
    <p>Submit applicant information securely and get instant evaluation results.</p>
    {#if apiNote}<small class="note">{apiNote}</small>{/if}
  </div>
</header>

<main>
  <form on:submit|preventDefault={submitForm}>
    <div class="row">
      <div class="col">
        <div class="input-icon"><i class="fas fa-user"></i>
          <input bind:value={firstName} on:input={clearForce} placeholder="First Name" required />
        </div>
      </div>
      <div class="col">
        <div class="input-icon"><i class="fas fa-user"></i>
          <input bind:value={lastName} on:input={clearForce} placeholder="Last Name" required />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="input-icon"><i class="fas fa-id-card"></i>
          <!-- SSN: digits-only, max 9, no pattern -->
          <input
            bind:value={ssn}
            placeholder="SSN (9 digits)"
            inputmode="numeric"
            maxlength="9"
            on:input={(e) => { ssn = e.currentTarget.value.replace(/\D/g,'').slice(0,9); clearForce(); }}
            required
          />
        </div>
      </div>
      <div class="col">
        <div class="input-icon"><i class="fas fa-calendar-alt"></i>
          <!-- DOB: auto-format YYYY-MM-DD, no pattern -->
          <input
            bind:value={dob}
            placeholder="DOB (YYYY-MM-DD)"
            inputmode="numeric"
            maxlength="10"
            on:input={(e) => { dob = formatDobInput(e.currentTarget.value); clearForce(); }}
            required
          />
        </div>
      </div>
    </div>

    <div class="input-icon"><i class="fas fa-envelope"></i>
      <input bind:value={email} on:input={clearForce} type="email" placeholder="Email" required />
    </div>

    <div class="input-icon"><i class="fas fa-map-marker-alt"></i>
      <input bind:value={addressLine1} on:input={clearForce} placeholder="Address Line 1" required />
    </div>

    <div class="input-icon"><i class="fas fa-map-marker-alt"></i>
      <input bind:value={addressLine2} on:input={clearForce} placeholder="Address Line 2" />
    </div>

    <div class="row">
      <div class="col">
        <div class="input-icon"><i class="fas fa-city"></i>
          <input bind:value={city} on:input={clearForce} placeholder="City" required />
        </div>
      </div>

      <div class="col">
        <div class="input-icon"><i class="fas fa-flag-usa"></i>
          <input
            bind:value={state}
            placeholder="State (2 letters)"
            on:input={(e) => { state = e.currentTarget.value.toUpperCase().slice(0,2); clearForce(); }}
            required
          />
        </div>
      </div>

      <div class="col">
        <div class="input-icon"><i class="fas fa-mail-bulk"></i>
          <input bind:value={postalCode} on:input={clearForce} placeholder="Postal Code" required />
        </div>
      </div>
    </div>

    <div class="input-icon"><i class="fas fa-globe"></i>
      <input
        bind:value={country}
        placeholder="Country (US)"
        on:input={(e) => { country = e.currentTarget.value.toUpperCase(); clearForce(); }}
        required
      />
    </div>

    <div class="row buttons">
      <div class="col"><button type="button" class="ghost" on:click={fillApproved}>Fill “Approved” persona</button></div>
      <div class="col"><button type="button" class="ghost" on:click={fillReview}>Fill “Manual Review” persona</button></div>
      <div class="col"><button type="button" class="ghost" on:click={fillDenied}>Fill “Denied” persona</button></div>
    </div>

    <button type="submit" disabled={loading}>
      {loading ? 'Submitting...' : 'Submit'}
    </button>
  </form>

  {#if resultObj}
    <div class="outcome-card {resultObj.outcomeClass}">
      <div class="outcome-header">
        <div class="dot"></div>
        <h3>{resultObj.title}</h3>
      </div>
      <p class="outcome-main">{resultObj.message}</p>
      {#if resultObj.outcomeRaw}
        <details>
          <summary>View raw Alloy response</summary>
          <pre>{JSON.stringify(resultObj.outcomeRaw, null, 2)}</pre>
        </details>
      {/if}
    </div>
  {/if}
</main>

<style>
  /* ---- Global layout & variables ---- */
  :root { --card-max: 720px; --brand: #0077cc; }

  *, *::before, *::after { box-sizing: border-box; }

  :global(html, body) {
    margin: 0; padding: 0;
    background: #f0f2f5; color: #333;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    line-height: 1.4;
  }

  /* ---- Header proportionate to form ---- */
  .header {
    background: var(--brand);
    color: #fff;
    padding: 28px 16px;
  }
  .header-inner {
    max-width: var(--card-max);
    margin: 0 auto;
    text-align: center;
  }
  .header h1 {
    margin: 0 0 6px 0;
    font-size: 24px;
    font-weight: 700;
  }
  .header p { margin: 0; opacity: 0.95; }
  .header .note { display:block; margin-top:8px; opacity: 0.9; }

  /* ---- Main / Form Card ---- */
  main {
    display: flex;
    justify-content: center;
    padding: 32px 16px 40px;
  }

  form {
    width: 100%;
    max-width: var(--card-max);
    background: #fff;
    color: #111;                 /* ensure text is visible on white */
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .row {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .col {
    flex: 1;
    min-width: 0; /* prevent overflow */
  }

  .input-icon { position: relative; }
  .input-icon i {
    position: absolute; top: 50%; left: 12px; transform: translateY(-50%);
    color: var(--brand);
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 12px 12px 12px 36px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 15px;
    color: #111;                 /* input text color */
    background: #fff;            /* input background */
  }
  input::placeholder { color: #6b7280; }

  input:focus {
    outline: none;
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
  }

  button {
    width: 100%;
    padding: 14px;
    font-size: 16px;
    font-weight: 600;
    background: var(--brand);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .buttons .col { flex: 1; }
  .buttons button.ghost {
    background: #e6f1fb;
    color: #0b66c3;
  }
  .buttons button.ghost:hover { filter: brightness(0.98); }

  /* ---- Outcome Card ---- */
  .outcome-card {
    border-radius: 10px; padding: 16px; margin: 18px auto 0;
    background: white;
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    border-left: 6px solid;
    max-width: var(--card-max);
  }

  .approved { border-color: #16a34a; }
  .denied   { border-color: #ef4444; }
  .review   { border-color: #f59e0b; }
  .unknown  { border-color: #64748b; }

  .outcome-header { display: flex; gap: 12px; align-items: center; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: currentColor; }

  details pre {
    background: #0f172a10; padding: 12px; border-radius: 6px; font-size: 12px;
    overflow: auto;
  }

  /* ---- Responsive ---- */
  @media (max-width: 680px) {
    .row { flex-direction: column; }
    .header h1 { font-size: 20px; }
    .header p { font-size: 14px; }
    form { padding: 20px; }
  }
</style>
