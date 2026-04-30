import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const OPTIONS = {
  yesNo: ["Yes", "No"],
  gender: ["Male", "Female"],
  multipleLines: ["Yes", "No", "No phone service"],
  internetService: ["DSL", "Fiber optic", "No"],
  internetAddon: ["Yes", "No", "No internet service"],
  contract: ["Month-to-month", "One year", "Two year"],
  payment: [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
  ]
};

const INITIAL_FORM = {
  gender: "Male",
  Partner: "No",
  Dependents: "No",
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "DSL",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "No",
  PaymentMethod: "Electronic check",
  tenure: 0,
  MonthlyCharges: 0,
  TotalCharges: 0
};

function SelectField({ label, name, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, name, value, min, max, step = 1, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
    </label>
  );
}

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [prediction, setPrediction] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    const numericFields = ["tenure", "MonthlyCharges", "TotalCharges"];
    setFormData((current) => ({
      ...current,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPrediction("");

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Prediction request failed");
      }

      setPrediction(payload.prediction || "No prediction returned");
    } catch (submitError) {
      setError(submitError.message || "Unexpected error while calling the API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Telco Retention Intelligence</p>
        <h1>Churn Radar</h1>
        <p>
          Fast, production-ready React interface for your churn model. Submit customer profiles,
          score them instantly, and focus retention actions where they matter most.
        </p>
      </header>

      <main className="layout">
        <section className="card glass form-card">
          <div className="card-head">
            <h2>Customer Profile</h2>
          </div>

          <form onSubmit={onSubmit}>
            <div className="section-grid">
              <h3>Demographics</h3>
              <SelectField label="Gender" name="gender" value={formData.gender} options={OPTIONS.gender} onChange={onChange} />
              <SelectField label="Partner" name="Partner" value={formData.Partner} options={OPTIONS.yesNo} onChange={onChange} />
              <SelectField label="Dependents" name="Dependents" value={formData.Dependents} options={OPTIONS.yesNo} onChange={onChange} />
            </div>

            <div className="section-grid">
              <h3>Phone Services</h3>
              <SelectField label="Phone Service" name="PhoneService" value={formData.PhoneService} options={OPTIONS.yesNo} onChange={onChange} />
              <SelectField label="Multiple Lines" name="MultipleLines" value={formData.MultipleLines} options={OPTIONS.multipleLines} onChange={onChange} />
            </div>

            <div className="section-grid">
              <h3>Internet Services</h3>
              <SelectField label="Internet Service" name="InternetService" value={formData.InternetService} options={OPTIONS.internetService} onChange={onChange} />
              <SelectField label="Online Security" name="OnlineSecurity" value={formData.OnlineSecurity} options={OPTIONS.internetAddon} onChange={onChange} />
              <SelectField label="Online Backup" name="OnlineBackup" value={formData.OnlineBackup} options={OPTIONS.internetAddon} onChange={onChange} />
              <SelectField label="Device Protection" name="DeviceProtection" value={formData.DeviceProtection} options={OPTIONS.internetAddon} onChange={onChange} />
              <SelectField label="Tech Support" name="TechSupport" value={formData.TechSupport} options={OPTIONS.internetAddon} onChange={onChange} />
              <SelectField label="Streaming TV" name="StreamingTV" value={formData.StreamingTV} options={OPTIONS.internetAddon} onChange={onChange} />
              <SelectField label="Streaming Movies" name="StreamingMovies" value={formData.StreamingMovies} options={OPTIONS.internetAddon} onChange={onChange} />
            </div>

            <div className="section-grid">
              <h3>Billing & Contract</h3>
              <SelectField label="Contract" name="Contract" value={formData.Contract} options={OPTIONS.contract} onChange={onChange} />
              <SelectField label="Paperless Billing" name="PaperlessBilling" value={formData.PaperlessBilling} options={OPTIONS.yesNo} onChange={onChange} />
              <SelectField label="Payment Method" name="PaymentMethod" value={formData.PaymentMethod} options={OPTIONS.payment} onChange={onChange} />
            </div>

            <div className="section-grid section-grid-3">
              <h3>Tenure & Charges</h3>
              <NumberField label="Tenure (months)" name="tenure" value={formData.tenure} min={0} max={120} onChange={onChange} />
              <NumberField label="Monthly Charges ($)" name="MonthlyCharges" value={formData.MonthlyCharges} min={0} max={300} step={0.01} onChange={onChange} />
              <NumberField label="Total Charges ($)" name="TotalCharges" value={formData.TotalCharges} min={0} max={20000} step={0.01} onChange={onChange} />
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Scoring..." : "Predict Churn"}
            </button>
          </form>
        </section>

        <aside className="card result-card">
          <h2>Prediction</h2>
          {!prediction && !error && (
            <p className="muted">Fill in the customer details and run the model to see the prediction.</p>
          )}
          {prediction && (
            <div className="result-pill neutral">
              {prediction}
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </aside>
      </main>
    </div>
  );
}
