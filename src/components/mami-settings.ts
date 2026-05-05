// Mami Settings modal — volum, mute, dark mode, viteză voce TTS, reminder hidratare,
// Admin PIN, device_role (mom/admin).
// Persistă în localStorage. Aplică temă imediat (CSS vars).

import {
  isHydrationReminderEnabled,
  setHydrationReminderEnabled,
} from "../services/notifications";
import { getSupabaseClient } from "../data/supabase";

const STORAGE_VOLUME = "mami-volume";
const STORAGE_MUTE = "mami-mute";
const STORAGE_DARK = "mami-dark";
const STORAGE_VOICE_RATE = "mami-voice-rate";
const STORAGE_ADMIN_PIN_HASH = "mami-admin-pin-hash";
const STORAGE_DEVICE_ROLE = "mami-device-role"; // "mom" | "admin"
const STORAGE_FAMILY_GROUP = "mami-family-group"; // { groupId, inviteCode, role }

export type DeviceRole = "mom" | "admin";

const STORAGE_DEVICE_ID = "mami-device-id";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(STORAGE_DEVICE_ID);
  if (!id) {
    id = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_DEVICE_ID, id);
  }
  return id;
}

async function syncDeviceRole(role: DeviceRole): Promise<void> {
  const client = await getSupabaseClient();
  if (!client) return;
  const deviceId = getOrCreateDeviceId();
  try {
    await client
      .from("user_profiles")
      .upsert(
        { device_id: deviceId, device_role: role },
        { onConflict: "device_id" },
      );
  } catch {
    /* silent — local-first, Supabase e opțional */
  }
}

// ---- Family Sharing ----

interface FamilyGroupInfo {
  groupId: string;
  inviteCode: string;
  role: "admin" | "member";
}

function getStoredFamilyGroup(): FamilyGroupInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_FAMILY_GROUP);
    return raw ? (JSON.parse(raw) as FamilyGroupInfo) : null;
  } catch {
    return null;
  }
}

function setStoredFamilyGroup(info: FamilyGroupInfo | null): void {
  if (info) localStorage.setItem(STORAGE_FAMILY_GROUP, JSON.stringify(info));
  else localStorage.removeItem(STORAGE_FAMILY_GROUP);
}

async function createFamilyGroup(displayName: string): Promise<string | null> {
  const client = await getSupabaseClient();
  if (!client) return null;
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await client.rpc("create_family_group", {
      p_device_id: deviceId,
      p_display_name: displayName,
    });
    if (error) {
      console.warn("[family] create_family_group:", error.message);
      return null;
    }
    const code = data as string;
    // Re-fetch group_id via get_my_groups
    const { data: groups } = await client.rpc("get_my_groups", {
      p_device_id: deviceId,
    });
    const myGroup = (
      groups as Array<{
        group_id: string;
        invite_code: string;
        role: string;
      }> | null
    )?.find((g) => g.invite_code === code);
    if (myGroup) {
      setStoredFamilyGroup({
        groupId: myGroup.group_id,
        inviteCode: code,
        role: "admin",
      });
    }
    return code;
  } catch (err) {
    console.warn("[family] create unreachable:", err);
    return null;
  }
}

async function joinFamilyGroup(
  code: string,
  displayName: string,
): Promise<boolean> {
  const client = await getSupabaseClient();
  if (!client) return false;
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await client.rpc("join_family_group", {
      p_invite_code: code.toUpperCase().trim(),
      p_device_id: deviceId,
      p_display_name: displayName,
    });
    if (error || !data) {
      console.warn(
        "[family] join_family_group:",
        error?.message ?? "invalid code",
      );
      return false;
    }
    setStoredFamilyGroup({
      groupId: data as string,
      inviteCode: code.toUpperCase().trim(),
      role: "member",
    });
    return true;
  } catch (err) {
    console.warn("[family] join unreachable:", err);
    return false;
  }
}

async function leaveFamilyGroup(): Promise<boolean> {
  const stored = getStoredFamilyGroup();
  if (!stored) return false;
  const client = await getSupabaseClient();
  if (!client) {
    setStoredFamilyGroup(null);
    return true;
  }
  const deviceId = getOrCreateDeviceId();
  try {
    await client.rpc("leave_family_group", {
      p_group_id: stored.groupId,
      p_device_id: deviceId,
    });
  } catch (err) {
    console.warn("[family] leave unreachable:", err);
  }
  setStoredFamilyGroup(null);
  return true;
}

// Simple hash: not cryptographic — just PIN obfuscation in localStorage
async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode("mami:" + pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getDeviceRole(): DeviceRole {
  return (
    (localStorage.getItem(STORAGE_DEVICE_ROLE) as DeviceRole | null) ?? "mom"
  );
}

export function isAdminMode(): boolean {
  return getDeviceRole() === "admin";
}

async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_ADMIN_PIN_HASH);
  if (!stored) return false;
  return (await hashPin(pin)) === stored;
}

async function setAdminPin(pin: string): Promise<void> {
  localStorage.setItem(STORAGE_ADMIN_PIN_HASH, await hashPin(pin));
}

function hasPinSet(): boolean {
  return !!localStorage.getItem(STORAGE_ADMIN_PIN_HASH);
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 300;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
  }
  :host([open]) { display: flex; }
  .modal {
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a2e);
    border-radius: 12px;
    width: min(420px, 92vw);
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border-radius: 12px 12px 0 0;
  }
  h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
  .close-btn {
    background: transparent;
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 1.4rem;
    min-height: 44px;
    min-width: 44px;
    border-radius: 6px;
  }
  .close-btn:hover { background: rgba(255, 255, 255, 0.18); }
  .close-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  .settings-list {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .row { display: flex; flex-direction: column; gap: 0.4rem; }
  .row.inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  label.field-label {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text, #1a1a2e);
  }
  .help { font-size: 0.82rem; color: var(--color-text-muted, #555577); }
  input[type="range"] {
    width: 100%;
    accent-color: var(--color-primary, #2e5c8a);
    min-height: 44px;
  }
  .toggle {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
  }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: #ccc;
    transition: 0.2s;
    border-radius: 28px;
  }
  .slider::before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: #fff;
    transition: 0.2s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  input:checked + .slider { background-color: var(--color-primary, #2e5c8a); }
  input:checked + .slider::before { transform: translateX(24px); }
  input:focus-visible + .slider {
    outline: 2px solid var(--color-primary, #2e5c8a);
    outline-offset: 2px;
  }
  select {
    padding: 0.5rem 0.75rem;
    min-height: 44px;
    font-size: 1rem;
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 6px;
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a2e);
  }
  select:focus-visible {
    outline: 2px solid var(--color-primary, #2e5c8a);
    outline-offset: 2px;
  }
  .footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid #e0e7ef;
    display: flex;
    justify-content: flex-end;
  }
  .btn-primary {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    padding: 0.5rem 1.25rem;
    min-height: 44px;
    border-radius: 6px;
    font-size: 0.95rem;
    cursor: pointer;
  }
  .btn-primary:hover { filter: brightness(1.1); }
</style>

<div class="modal" role="dialog" aria-labelledby="settings-title" aria-modal="true">
  <header>
    <h2 id="settings-title">Setări</h2>
    <button class="close-btn" type="button" id="close-btn" aria-label="Închide setările">✕</button>
  </header>
  <div class="settings-list">
    <div class="row">
      <label class="field-label" for="vol">Volum muzică ambient</label>
      <input type="range" id="vol" min="0" max="1" step="0.05" />
      <span class="help">Glisează pentru a regla. Atingere lungă pe iconiță 🎵 pornește/oprește muzica.</span>
    </div>
    <div class="row inline">
      <div>
        <label class="field-label" for="mute">Sunet oprit complet</label>
        <div class="help">Dezactivează ambient + voce TTS</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="mute" />
        <span class="slider"></span>
      </label>
    </div>
    <div class="row inline">
      <div>
        <label class="field-label" for="dark">Mod întunecat</label>
        <div class="help">Pentru lectură seara, ușurează ochii</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="dark" />
        <span class="slider"></span>
      </label>
    </div>
    <div class="row">
      <label class="field-label" for="rate">Viteză voce (TTS)</label>
      <select id="rate">
        <option value="0.7">Lent</option>
        <option value="0.9">Normal (recomandat)</option>
        <option value="1.1">Rapid</option>
      </select>
      <span class="help">Cum vorbește aplicația când citește documente cu voce</span>
    </div>
    <div class="row inline">
      <div>
        <label class="field-label" for="hydration">Reminder apă (la 2h)</label>
        <div class="help">Notificare locală cât timp aplicația e deschisă</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="hydration" />
        <span class="slider"></span>
      </label>
    </div>

    <hr style="border:none;border-top:1px solid #e0e7ef;margin:0.25rem 0" />

    <div class="row">
      <label class="field-label">Mod administrator</label>
      <div class="help" id="admin-status-text">Mod: Mama</div>
      <div id="pin-area" style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem">
        <input type="password" id="pin-input" placeholder="PIN (4-8 cifre)"
          style="padding:0.5rem;font-size:1rem;border:1.5px solid #2e5c8a;border-radius:6px;min-height:44px" />
        <div style="display:flex;gap:0.5rem">
          <button class="btn-primary" type="button" id="pin-confirm-btn" style="flex:1;font-size:0.9rem">Confirmă PIN</button>
          <button class="btn-outline" type="button" id="pin-exit-admin-btn" style="display:none;flex:1;font-size:0.9rem">Ieși din admin</button>
        </div>
        <div class="help" id="pin-error" style="color:#c0392b;display:none">PIN incorect</div>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid #e0e7ef;margin:0.25rem 0" />

    <div class="row">
      <label class="field-label">👨‍👩‍👧 Familie (sharing)</label>
      <div class="help" id="family-status-text">Nu ești într-un grup de familie.</div>
      <div id="family-area" style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem">
        <input type="text" id="family-display-name" placeholder="Numele tău (ex. Roland)"
          style="padding:0.5rem;font-size:1rem;border:1.5px solid #2e5c8a;border-radius:6px;min-height:44px" />
        <div style="display:flex;gap:0.5rem">
          <button class="btn-primary" type="button" id="family-create-btn" style="flex:1;font-size:0.9rem">Generează cod</button>
          <button class="btn-primary" type="button" id="family-join-toggle-btn" style="flex:1;font-size:0.9rem;background:#5b6c7e">Conectează cu cod</button>
        </div>
        <div id="family-join-area" style="display:none;flex-direction:column;gap:0.4rem">
          <input type="text" id="family-code-input" placeholder="Cod 8 caractere (ex. AB12CD34)" maxlength="8"
            style="padding:0.5rem;font-size:1rem;border:1.5px solid #2e5c8a;border-radius:6px;min-height:44px;text-transform:uppercase;letter-spacing:0.1em" />
          <button class="btn-primary" type="button" id="family-join-confirm-btn" style="font-size:0.9rem">Conectează</button>
        </div>
        <div id="family-code-display" style="display:none;background:#e8f4ff;padding:0.6rem;border-radius:6px;font-family:monospace;font-size:1.2rem;text-align:center;letter-spacing:0.15em;font-weight:600;color:#2e5c8a"></div>
        <button class="btn-primary" type="button" id="family-leave-btn" style="display:none;background:#c0392b;font-size:0.9rem">Părăsește grupul</button>
        <div class="help" id="family-error" style="color:#c0392b;display:none"></div>
      </div>
    </div>
  </div>
  <div class="footer">
    <button class="btn-primary" type="button" id="done-btn">Gata</button>
  </div>
</div>
`;

export class MamiSettings extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _ready = false;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  static get observedAttributes(): string[] {
    return ["open"];
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;
    this._loadValues();
    this._wire();
    applyDarkMode(this._readBool(STORAGE_DARK, false));
  }

  private _readBool(key: string, fallback: boolean): boolean {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true" || v === "1";
  }

  private _readNumber(key: string, fallback: number): number {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  }

  private _loadValues(): void {
    const vol = this._sr.querySelector("#vol") as HTMLInputElement | null;
    const mute = this._sr.querySelector("#mute") as HTMLInputElement | null;
    const dark = this._sr.querySelector("#dark") as HTMLInputElement | null;
    const rate = this._sr.querySelector("#rate") as HTMLSelectElement | null;
    const hydration = this._sr.querySelector(
      "#hydration",
    ) as HTMLInputElement | null;
    if (vol) vol.value = String(this._readNumber(STORAGE_VOLUME, 0.3));
    if (mute) mute.checked = this._readBool(STORAGE_MUTE, false);
    if (dark) dark.checked = this._readBool(STORAGE_DARK, false);
    if (rate) rate.value = String(this._readNumber(STORAGE_VOICE_RATE, 0.9));
    if (hydration) hydration.checked = isHydrationReminderEnabled();
  }

  private _wire(): void {
    const vol = this._sr.querySelector("#vol") as HTMLInputElement | null;
    const mute = this._sr.querySelector("#mute") as HTMLInputElement | null;
    const dark = this._sr.querySelector("#dark") as HTMLInputElement | null;
    const rate = this._sr.querySelector("#rate") as HTMLSelectElement | null;

    vol?.addEventListener("input", () => {
      localStorage.setItem(STORAGE_VOLUME, vol.value);
      this._dispatch("mami-settings-volume", { value: Number(vol.value) });
    });
    mute?.addEventListener("change", () => {
      localStorage.setItem(STORAGE_MUTE, String(mute.checked));
      this._dispatch("mami-settings-mute", { value: mute.checked });
    });
    dark?.addEventListener("change", () => {
      localStorage.setItem(STORAGE_DARK, String(dark.checked));
      applyDarkMode(dark.checked);
      this._dispatch("mami-settings-dark", { value: dark.checked });
    });
    rate?.addEventListener("change", () => {
      localStorage.setItem(STORAGE_VOICE_RATE, rate.value);
      this._dispatch("mami-settings-rate", { value: Number(rate.value) });
    });

    const hydration = this._sr.querySelector(
      "#hydration",
    ) as HTMLInputElement | null;
    hydration?.addEventListener("change", () => {
      setHydrationReminderEnabled(hydration.checked);
      this._dispatch("mami-settings-hydration", { value: hydration.checked });
    });

    // Admin PIN logic
    this._updateAdminStatus();
    this._sr
      .querySelector("#pin-confirm-btn")
      ?.addEventListener("click", () => {
        void this._handlePinConfirm();
      });
    this._sr
      .querySelector("#pin-exit-admin-btn")
      ?.addEventListener("click", () => {
        localStorage.setItem(STORAGE_DEVICE_ROLE, "mom");
        this._updateAdminStatus();
        this._dispatch("mami-role-change", { role: "mom" });
        void syncDeviceRole("mom");
      });

    // Family sharing
    this._updateFamilyStatus();
    this._sr
      .querySelector("#family-create-btn")
      ?.addEventListener("click", () => void this._handleFamilyCreate());
    this._sr
      .querySelector("#family-join-toggle-btn")
      ?.addEventListener("click", () => this._toggleFamilyJoinArea());
    this._sr
      .querySelector("#family-join-confirm-btn")
      ?.addEventListener("click", () => void this._handleFamilyJoin());
    this._sr
      .querySelector("#family-leave-btn")
      ?.addEventListener("click", () => void this._handleFamilyLeave());

    this._sr.querySelector("#close-btn")?.addEventListener("click", () => {
      this.removeAttribute("open");
    });
    this._sr.querySelector("#done-btn")?.addEventListener("click", () => {
      this.removeAttribute("open");
    });
    this.addEventListener("click", (e) => {
      if (e.target === this) this.removeAttribute("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.hasAttribute("open"))
        this.removeAttribute("open");
    });
  }

  private _updateAdminStatus(): void {
    const role = getDeviceRole();
    const statusText = this._sr.querySelector("#admin-status-text");
    const exitBtn = this._sr.querySelector(
      "#pin-exit-admin-btn",
    ) as HTMLElement | null;
    const pinInput = this._sr.querySelector(
      "#pin-input",
    ) as HTMLInputElement | null;
    if (statusText) {
      statusText.textContent =
        role === "admin"
          ? "Mod: Administrator activ ✓"
          : hasPinSet()
            ? "Mod: Mama (introdu PIN pentru admin)"
            : "Mod: Mama (setează PIN admin)";
    }
    if (exitBtn) exitBtn.style.display = role === "admin" ? "block" : "none";
    if (pinInput) {
      pinInput.placeholder =
        role === "admin"
          ? "PIN curent"
          : hasPinSet()
            ? "PIN admin"
            : "Setează PIN nou (4-8 cifre)";
    }
  }

  private async _handlePinConfirm(): Promise<void> {
    const pinInput = this._sr.querySelector(
      "#pin-input",
    ) as HTMLInputElement | null;
    const errorEl = this._sr.querySelector("#pin-error") as HTMLElement | null;
    if (!pinInput?.value) return;
    const pin = pinInput.value.trim();
    if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
      if (errorEl) {
        errorEl.textContent = "PIN trebuie să fie 4-8 cifre";
        errorEl.style.display = "block";
      }
      return;
    }
    if (errorEl) errorEl.style.display = "none";

    if (!hasPinSet()) {
      await setAdminPin(pin);
      localStorage.setItem(STORAGE_DEVICE_ROLE, "admin");
      this._updateAdminStatus();
      this._dispatch("mami-role-change", { role: "admin" });
      pinInput.value = "";
    } else {
      const ok = await verifyPin(pin);
      if (ok) {
        localStorage.setItem(STORAGE_DEVICE_ROLE, "admin");
        this._updateAdminStatus();
        this._dispatch("mami-role-change", { role: "admin" });
        pinInput.value = "";
      } else {
        if (errorEl) {
          errorEl.textContent = "PIN incorect";
          errorEl.style.display = "block";
        }
        pinInput.value = "";
      }
    }
  }

  private _dispatch<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  private _updateFamilyStatus(): void {
    const stored = getStoredFamilyGroup();
    const statusText = this._sr.querySelector("#family-status-text");
    const codeDisplay = this._sr.querySelector(
      "#family-code-display",
    ) as HTMLElement | null;
    const leaveBtn = this._sr.querySelector(
      "#family-leave-btn",
    ) as HTMLElement | null;
    const createBtn = this._sr.querySelector(
      "#family-create-btn",
    ) as HTMLElement | null;
    const joinToggleBtn = this._sr.querySelector(
      "#family-join-toggle-btn",
    ) as HTMLElement | null;
    const joinArea = this._sr.querySelector(
      "#family-join-area",
    ) as HTMLElement | null;
    const errorEl = this._sr.querySelector(
      "#family-error",
    ) as HTMLElement | null;

    if (stored) {
      if (statusText)
        statusText.textContent =
          stored.role === "admin"
            ? "✓ Ești admin într-un grup. Cod activ:"
            : "✓ Ești conectat la un grup. Cod:";
      if (codeDisplay) {
        codeDisplay.textContent = stored.inviteCode;
        codeDisplay.style.display = "block";
      }
      if (leaveBtn) leaveBtn.style.display = "block";
      if (createBtn) createBtn.style.display = "none";
      if (joinToggleBtn) joinToggleBtn.style.display = "none";
      if (joinArea) joinArea.style.display = "none";
    } else {
      if (statusText)
        statusText.textContent = "Nu ești într-un grup de familie.";
      if (codeDisplay) codeDisplay.style.display = "none";
      if (leaveBtn) leaveBtn.style.display = "none";
      if (createBtn) createBtn.style.display = "";
      if (joinToggleBtn) joinToggleBtn.style.display = "";
    }
    if (errorEl) errorEl.style.display = "none";
  }

  private _toggleFamilyJoinArea(): void {
    const joinArea = this._sr.querySelector(
      "#family-join-area",
    ) as HTMLElement | null;
    if (!joinArea) return;
    const visible = joinArea.style.display !== "none";
    joinArea.style.display = visible ? "none" : "flex";
  }

  private _showFamilyError(msg: string): void {
    const errorEl = this._sr.querySelector(
      "#family-error",
    ) as HTMLElement | null;
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }

  private async _handleFamilyCreate(): Promise<void> {
    const nameInput = this._sr.querySelector(
      "#family-display-name",
    ) as HTMLInputElement | null;
    const name = nameInput?.value.trim() || "Admin";
    const code = await createFamilyGroup(name);
    if (!code) {
      this._showFamilyError(
        "Nu am putut crea grupul. Verifică conexiunea + Supabase.",
      );
      return;
    }
    this._updateFamilyStatus();
    this._dispatch("mami-family-change", { role: "admin", code });
  }

  private async _handleFamilyJoin(): Promise<void> {
    const codeInput = this._sr.querySelector(
      "#family-code-input",
    ) as HTMLInputElement | null;
    const nameInput = this._sr.querySelector(
      "#family-display-name",
    ) as HTMLInputElement | null;
    const code = codeInput?.value.trim() ?? "";
    if (code.length !== 8) {
      this._showFamilyError("Codul trebuie să aibă exact 8 caractere.");
      return;
    }
    const name = nameInput?.value.trim() || "Membru";
    const ok = await joinFamilyGroup(code, name);
    if (!ok) {
      this._showFamilyError("Cod invalid sau expirat.");
      return;
    }
    this._updateFamilyStatus();
    this._dispatch("mami-family-change", { role: "member", code });
  }

  private async _handleFamilyLeave(): Promise<void> {
    if (
      !confirm(
        "Sigur vrei să părăsești grupul? Datele rămân pe acest dispozitiv.",
      )
    )
      return;
    await leaveFamilyGroup();
    this._updateFamilyStatus();
    this._dispatch("mami-family-change", { role: null, code: null });
  }
}

function applyDarkMode(on: boolean): void {
  document.documentElement.classList.toggle("dark", on);
}

customElements.define("mami-settings", MamiSettings);
