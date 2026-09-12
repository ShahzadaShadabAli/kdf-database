"use client";

// Three-part structured address: UC (Union Council) / Tehsil / District,
// used for both present and permanent address on a case.
export function AddressFields({ value, onChange, disabled }) {
  function update(field, v) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className="grid grid-3">
      <div className="field">
        <label>UC</label>
        <input
          value={value.uc}
          onChange={(e) => update("uc", e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="field">
        <label>Tehsil</label>
        <input
          value={value.tehsil}
          onChange={(e) => update("tehsil", e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="field">
        <label>District</label>
        <input
          value={value.district}
          onChange={(e) => update("district", e.target.value)}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
