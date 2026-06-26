import React, { useEffect, useRef, useState } from "react";
import Header from "../Dashboard/Header";
import Navigation from "../Dashboard/Navigation";
import {
  getCartData,
  updateCartData,
  placeOrder,
  updateChoosePrescription,
  updateDeliveryAddress,
  getCartDataForID,
  addToCart,
  getUser,
  listAddresses,
  addAddress,
  updateAddress,
  getOffers,
  applyCouponAPI,
  listPrescriptions,
  uploadFile,
  updatePrescription,
  removePrescriptionFromCart,
  updateDeliveryCharge,
  assignOfferToCart,
  updateCODCharge,
  getCartCount,
} from "../../api/Api";
import { getFooterProducts } from "../../api/Api";

import Swal from "sweetalert2";
import { SavedAddress } from "../SavedAddress/SavedAddress";
import { UploadPrescription } from "../UploadPrescription/UploadPrescription";
import { useLocation, useNavigate } from "react-router-dom";

import { Helmet } from "react-helmet";
import { useCart } from "../../api/stateContext";
import {
  MdLocalShipping,
  MdCheckCircle,
  MdShoppingCart,
  MdAdd,
  MdRemove,
  MdLocalOffer,
  MdLocationOn,
  MdEdit,
  MdClose,
  MdArrowBack,
  MdCloudUpload,
  MdMedicalServices,
  MdPhone,
  MdCelebration,
  MdChevronLeft,
  MdChevronRight,
  MdAssignmentInd,
} from "react-icons/md";
import { FiArrowRight, FiShield, FiRefreshCw, FiTrash2, FiFileText } from "react-icons/fi";
import { BsPatchCheckFill, BsStars } from "react-icons/bs";



/* ─── Address Selection Modal ────────────────────────────────────────────── */
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const AddressSelectionModal = ({ open, onClose, onAddressSelected, cartId }) => {
  const navigate = useNavigate();
  const [view, setView] = React.useState("list");
  const [addresses, setAddresses] = React.useState([]);
  const [loadingAddresses, setLoadingAddresses] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [editingAddress, setEditingAddress] = React.useState(null);
  const [deliveringId, setDeliveringId] = React.useState(null);
  const [savingAddress, setSavingAddress] = React.useState(false);
  const [postOffices, setPostOffices] = React.useState([]);
  const [isFetchingPin, setIsFetchingPin] = React.useState(false);
  const [pincode, setPincode] = React.useState("");
  const [pincodeInput, setPincodeInput] = React.useState("");
  const [pincodeError, setPincodeError] = React.useState("");
  const [deliveryInfo, setDeliveryInfo] = React.useState(null);
  const [checkingPincode, setCheckingPincode] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "", phone: "", doorNo: "", street: "",
    locality: "", pincode: "", city: "", state: "", type: "home",
  });
  const [formErrors, setFormErrors] = React.useState({});

  React.useEffect(() => {
    if (open) { setView("list"); loadAddresses(); setPincodeInput(""); setPincodeError(""); setDeliveryInfo(null); }
  }, [open]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try { const data = await listAddresses(navigate); setAddresses(data || []); }
    catch (e) { console.error(e); }
    finally { setLoadingAddresses(false); }
  };

  React.useEffect(() => {
    if (pincode.length !== 6) return;
    const autofill = async () => {
      setIsFetchingPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
          const offices = data[0].PostOffice;
          setPostOffices(offices);
          const first = offices[0];
          setFormData(prev => ({ ...prev, city: first.District, state: first.State, pincode }));
        } else { setPostOffices([]); }
      } catch (e) { setPostOffices([]); }
      finally { setIsFetchingPin(false); }
    };
    autofill();
  }, [pincode]);

  const openAddForm = (addr = null) => {
    if (addr) {
      const parts = (addr.address1 || "").split(",").map(p => p.trim());
      setFormData({
        name: addr.name || "", phone: addr.phone_number || "",
        doorNo: parts[0] || "", street: parts[1] || "",
        locality: parts[2] || "", pincode: addr.pincode || "",
        city: addr.city || "", state: addr.state || "", type: addr.type || "home",
      });
      setPincode(addr.pincode || "");
      setEditingAddress(addr);
    } else {
      setFormData({ name: "", phone: "", doorNo: "", street: "", locality: "", pincode: "", city: "", state: "", type: "home" });
      setPincode(""); setEditingAddress(null); setPostOffices([]);
    }
    setFormErrors({});
    if (!addr && deliveryInfo?.pincode) {
      setPincode(deliveryInfo.pincode);
      setFormData(prev => ({ ...prev, pincode: deliveryInfo.pincode }));
    }
    setView("form");
  };

  const getDeliveryDays = (pin) => {
    const firstDigit = String(pin).trim().charAt(0);
    if (firstDigit === "6") return "1-2 days";
    if (firstDigit === "5") return "2 days";
    return "3-4 days";
  };

  const handleCheckPincode = async (pinToCheck = null) => {
    const val = (typeof pinToCheck === "string" ? pinToCheck : pincodeInput) || "";
    const cleaned = String(val).trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) { setPincodeError("Please enter a valid 6-digit pincode."); return; }
    setPincodeError("");
    setCheckingPincode(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
      const data = await res.json();
      if (!data?.[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) { setPincodeError("Invalid pincode. Please try again."); setCheckingPincode(false); return; }
      const po = data[0].PostOffice[0];
      const city = `${po.Name}, ${po.District || po.Block || ""}`;
      const days = getDeliveryDays(cleaned);
      setDeliveryInfo({ pincode: cleaned, city, days });
    } catch (_) { setPincodeError("Could not verify pincode. Please try again."); }
    finally { setCheckingPincode(false); }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = true;
    if (!formData.phone || formData.phone.length !== 10) errs.phone = true;
    if (!formData.doorNo.trim()) errs.doorNo = true;
    if (!formData.street.trim()) errs.street = true;
    if (!formData.pincode || formData.pincode.length !== 6) errs.pincode = true;
    if (!formData.city.trim()) errs.city = true;
    if (!formData.state) errs.state = true;
    if (!formData.type) errs.type = true;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveForm = async () => {
    if (!validateForm()) return;
    setSavingAddress(true);
    const constructed = [formData.doorNo, formData.street, formData.locality, formData.city].filter(Boolean).join(", ");
    const payload = {
      id: editingAddress?.id, type: formData.type, name: formData.name,
      address1: constructed, pincode: formData.pincode,
      state: formData.state, city: formData.city, phone_number: formData.phone,
    };
    try {
      if (editingAddress) { await updateAddress(editingAddress.id, payload, navigate); }
      else { await addAddress(payload, navigate); }
      await loadAddresses();
      setView("list");
    } catch (e) { console.error(e); }
    finally { setSavingAddress(false); }
  };

  const handleDeliverHere = async (addressId) => {
    setDeliveringId(addressId);
    try {
      await updateDeliveryAddress(addressId, cartId);
      onAddressSelected(addressId);
      onClose();
    } catch (e) { console.error(e); }
    finally { setDeliveringId(null); }
  };

  if (!open) return null;

  const renderFormInput = ({ field, placeholder, type = "text", readOnly = false, maxLength }) => (
    <input
      key={field}
      type={type} placeholder={placeholder} value={formData[field]}
      readOnly={readOnly} maxLength={maxLength}
      onChange={e => {
        if (readOnly) return;
        const val = type === "tel" ? e.target.value.replace(/\D/g, "") : e.target.value;
        setFormData(prev => ({ ...prev, [field]: val }));
        setFormErrors(prev => ({ ...prev, [field]: false }));
      }}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box",
        border: `1.5px solid ${formErrors[field] ? "#ef4444" : "#e5e7eb"}`,
        fontSize: 13, outline: "none", marginBottom: 14,
        color: readOnly ? "#9ca3af" : "#111827",
        background: readOnly ? "#f3f4f6" : "#fff",
      }}
    />
  );

  const Label = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{children}</div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 200000, backdropFilter: "blur(4px)" }} />

      <div onClick={e => e.stopPropagation()} className="address-modal-content" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(520px, 96vw)", maxHeight: "90vh", background: "#fff",
        borderRadius: 22, boxShadow: "0 28px 80px rgba(0,0,0,0.24)",
        zIndex: 200001, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Mobile Handle */}
        <div className="mobile-only" style={{ height: 5, width: 40, background: "#e5e7eb", borderRadius: 3, margin: "10px auto 0", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #f0eeff", flexShrink: 0, gap: 8 }}>
          {view === "form" && (
            <button onClick={() => setView("list")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: 22, lineHeight: 1, padding: 0, display: "flex", alignItems: "center" }}
            ><MdArrowBack size={22} /></button>
          )}
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827", flex: 1 }}>
            {view === "list" ? "Select Delivery Address" : (editingAddress ? "Edit Address" : "New Address")}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: 4 }}>
            <MdClose size={22} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 24px" }}>
          {view === "list" && (
            <>
              <button onClick={() => openAddForm(null)} style={{
                width: "100%", background: "#f5f3ff", border: "2px dashed #c4b5fd",
                borderRadius: 14, padding: "14px 0", color: "#7c3aed", fontWeight: 700,
                fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, marginBottom: 20,
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add New Address
              </button>

              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Saved Addresses
              </div>

              {loadingAddresses ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ borderRadius: 14, padding: "14px 16px", border: "1.5px solid #f0eeff", background: "#fafafa" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#e5e7eb", animation: "addr-skel-pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ width: 100, height: 13, borderRadius: 6, background: "#e5e7eb", animation: "addr-skel-pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ width: 70, height: 12, borderRadius: 6, background: "#f3f4f6", animation: "addr-skel-pulse 1.4s ease-in-out 0.1s infinite", marginLeft: 4 }} />
                        <div style={{ marginLeft: "auto", width: 44, height: 18, borderRadius: 20, background: "#f3f4f6", animation: "addr-skel-pulse 1.4s ease-in-out 0.2s infinite" }} />
                      </div>
                      <div style={{ paddingLeft: 22, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ width: "90%", height: 11, borderRadius: 5, background: "#e5e7eb", animation: "addr-skel-pulse 1.4s ease-in-out 0.15s infinite" }} />
                        <div style={{ width: "60%", height: 11, borderRadius: 5, background: "#f3f4f6", animation: "addr-skel-pulse 1.4s ease-in-out 0.25s infinite" }} />
                      </div>
                      <div style={{ display: "flex", gap: 10, paddingLeft: 22 }}>
                        <div style={{ width: 100, height: 32, borderRadius: 8, background: "#e5e7eb", animation: "addr-skel-pulse 1.4s ease-in-out 0.3s infinite" }} />
                        <div style={{ width: 60, height: 32, borderRadius: 8, background: "#f3f4f6", animation: "addr-skel-pulse 1.4s ease-in-out 0.35s infinite" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>No saved addresses. Add one above.</div>
              ) : addresses.map(addr => (
                <div key={addr.id} onClick={() => setSelectedId(addr.id)} style={{
                  border: `1.5px solid ${selectedId === addr.id ? "#7c3aed" : "#f0eeff"}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 12,
                  background: selectedId === addr.id ? "#faf5ff" : "#fafafa",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                    <MdLocationOn size={15} color="#7c3aed" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{addr.name}</span>
                    {addr.phone_number && <span style={{ fontSize: 12, color: "#6b7280" }}>| +91 {addr.phone_number}</span>}
                    <span style={{
                      marginLeft: "auto", flexShrink: 0, fontSize: 10, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 20, textTransform: "uppercase",
                      background: addr.type === "home" ? "#f5f3ff" : "#f0f9ff",
                      color: addr.type === "home" ? "#7c3aed" : "#0369a1",
                    }}>{addr.type || "home"}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 12, paddingLeft: 22 }}>
                    {addr.address1}{addr.state ? `, ${addr.state}` : ""}{addr.pincode ? ` - ${addr.pincode}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 10, paddingLeft: 22 }}>
                    <button onClick={e => { e.stopPropagation(); handleDeliverHere(addr.id); }}
                      disabled={deliveringId === addr.id}
                      style={{
                        background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                        padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        opacity: deliveringId === addr.id ? 0.7 : 1,
                      }}>
                      {deliveringId === addr.id ? "Setting…" : "Deliver Here"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); openAddForm(addr); }}
                      style={{
                        background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8,
                        padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer",
                      }}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, border: "1px solid #f0eeff", background: "#fafafa" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Deliver to a different pincode?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Enter Pincode" maxLength={6} value={pincodeInput}
                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); setPincodeInput(val); setPincodeError(""); if (val.length === 6) handleCheckPincode(val); }}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckPincode()}
                    style={{ flex: 1, border: `1.5px solid ${pincodeError ? "#ef4444" : "#e5e7eb"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => handleCheckPincode()} disabled={checkingPincode}
                    style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: checkingPincode ? "not-allowed" : "pointer", opacity: checkingPincode ? 0.7 : 1 }}>
                    {checkingPincode ? "Checking…" : "Check"}
                  </button>
                </div>
                {pincodeError && (
                  <div style={{ fontSize: 11.5, color: "#ef4444", marginTop: 6, fontWeight: 500 }}>{pincodeError}</div>
                )}
                {deliveryInfo && !pincodeError && (
                  <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 10 }}>
                    <MdLocalShipping size={18} color="#16a34a" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#15803d" }}>Delivery to {deliveryInfo.city}</div>
                      <div style={{ fontSize: 11.5, color: "#166534" }}>Estimated delivery in <strong>{deliveryInfo.days}</strong></div>
                    </div>
                    <button onClick={() => openAddForm(null)}
                      style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {view === "form" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Label>Type *</Label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["home", "office", "other"].map(t => (
                    <button key={t} onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                      style={{
                        padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                        cursor: "pointer", textTransform: "capitalize",
                        border: formData.type === t ? "none" : "1.5px solid #e5e7eb",
                        background: formData.type === t ? "#7c3aed" : "#fff",
                        color: formData.type === t ? "#fff" : "#6b7280",
                      }}>{t}</button>
                  ))}
                </div>
                {formErrors.type && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>Select an address type</div>}
              </div>

              <Label>Full Name *</Label>
              {renderFormInput({ field: "name", placeholder: "e.g. Rahul Sharma" })}
              <Label>Phone Number *</Label>
              {renderFormInput({ field: "phone", placeholder: "10-digit phone number", type: "tel", maxLength: 10 })}

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}><Label>Door / Flat No *</Label>{renderFormInput({ field: "doorNo", placeholder: "e.g. 402" })}</div>
                <div style={{ flex: 2 }}><Label>Street / Area *</Label>{renderFormInput({ field: "street", placeholder: "e.g. Park Avenue" })}</div>
              </div>

              <Label>Pincode *</Label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input type="tel" placeholder="6-digit pincode" maxLength={6} value={pincode}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "");
                    setPincode(v);
                    setFormData(prev => ({ ...prev, pincode: v }));
                    setFormErrors(prev => ({ ...prev, pincode: false }));
                  }}
                  style={{
                    width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, boxSizing: "border-box",
                    border: `1.5px solid ${formErrors.pincode ? "#ef4444" : "#e5e7eb"}`, fontSize: 13, outline: "none",
                  }} />
                {isFetchingPin && (
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "addr-spin 0.7s linear infinite" }} />
                )}
              </div>

              {postOffices.length > 1 && (
                <>
                  <Label>Locality *</Label>
                  <select value={formData.locality} onChange={e => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 14, background: "#fff" }}>
                    <option value="">-- Select Locality --</option>
                    {postOffices.map((po, i) => <option key={i} value={po.Name}>{po.Name}</option>)}
                  </select>
                </>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}><Label>City *</Label>{renderFormInput({ field: "city", placeholder: "Auto-filled", readOnly: true })}</div>
                <div style={{ flex: 1 }}>
                  <Label>State *</Label>
                  <select value={formData.state} onChange={e => { setFormData(prev => ({ ...prev, state: e.target.value })); setFormErrors(prev => ({ ...prev, state: false })); }}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${formErrors.state ? "#ef4444" : "#e5e7eb"}`, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 14, background: "#fff" }}>
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleSaveForm} disabled={savingAddress}
                style={{ width: "100%", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 4, opacity: savingAddress ? 0.7 : 1 }}>
                {savingAddress ? "Saving…" : (editingAddress ? "Save Changes" : "Save Address")}
              </button>
              <button onClick={() => setView("list")}
                style={{ width: "100%", background: "none", color: "#6b7280", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes addr-spin { to { transform: translateY(-50%) rotate(360deg); } } 
        @keyframes addr-skel-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes addr-slide-up {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, -50%); }
        }
        @keyframes addr-slide-up-mobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .address-modal-content {
          animation: addr-slide-up 0.3s ease-out forwards;
        }
        @media (max-width: 640px) {
          .address-modal-content {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            transform: translateY(0) !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 24px 24px 0 0 !important;
            max-height: 85vh !important;
            animation: addr-slide-up-mobile 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
          }
        }
      `}</style>
    </>
  );
};


/* ─── Progress Steps ─────────────────────────────────────────────────────── */
const ProgressBar = ({ steps }) => {
  const completed = steps.filter((s) => s.status === "completed").length;
  const current = steps.findIndex((s) => s.status === "current");
  const activeIdx = current !== -1 ? current : completed;
  const pct = steps.length > 1 ? (activeIdx / (steps.length - 1)) * 100 : 0;

  return (
    <div style={{ padding: "20px 24px 8px" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 3, background: "#e9e4f7", borderRadius: 4, zIndex: 0 }} />
        <div style={{ position: "absolute", top: 14, left: 14, height: 3, width: `calc(${pct}% * (100% - 28px) / 100)`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 4, zIndex: 1, transition: "width 0.6s ease" }} />

        {steps.map((step, i) => {
          const isDone = step.status === "completed";
          const isCurrent = step.status === "current" || (current === -1 && i === completed);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, position: "relative" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isDone ? "#7c3aed" : isCurrent ? "#fff" : "#f3f0fb",
                border: isDone ? "none" : isCurrent ? "2.5px solid #7c3aed" : "2px solid #d8cff2",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isCurrent ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                transition: "all 0.3s",
              }}>
                {isDone ? <MdCheckCircle size={16} color="#fff" /> : (
                  <span style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? "#7c3aed" : "#c4b5fd" }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: isDone || isCurrent ? "#7c3aed" : "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center", maxWidth: 64, display: "block" }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FreeDeliveryBar = ({ totalAmt }) => {
  const isFirstTier = totalAmt < 500;
  const threshold = isFirstTier ? 500 : 1000;

  const remaining = Math.max(0, threshold - totalAmt);
  const pct = Math.min((totalAmt / threshold) * 100, 100);

  const isFreeDelivery = totalAmt >= 500;
  const isCouponBenefit = totalAmt >= 1000;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "16px 20px",
      border: isFreeDelivery ? "1px solid #bbf7d0" : "1px solid #ede9fe",
      transition: "all 0.4s ease",
      boxShadow: "0 4px 15px rgba(124,58,237,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: isFreeDelivery ? "#f0fdf4" : "#f5f3ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.4s ease",
          boxShadow: isFreeDelivery ? "inset 0 0 10px rgba(22,163,74,0.05)" : "none",
        }}>
          {isCouponBenefit ? (
            <MdLocalOffer size={20} color="#16a34a" />
          ) : (
            <MdLocalShipping size={20} color={isFreeDelivery ? "#16a34a" : "#7c3aed"} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
            {isCouponBenefit ? (
              <><MdCelebration size={16} color="#16a34a" /> Max Savings Unlocked! (Free Delivery + 5% OFF)</>
            ) : isFreeDelivery ? (
              <>
                <span style={{ color: "#16a34a" }}>Free Delivery Unlocked!</span>
              </>
            ) : (
              "Unlock Free Delivery"
            )}
            {isFreeDelivery && !isCouponBenefit && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 12, marginLeft: "auto" }}>
                Next Goal: ₹1000
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
            {isCouponBenefit ? (
              "You are getting Free Delivery + 5% extra discount!"
            ) : isFreeDelivery ? (
              <>Add <span style={{ color: "#7c3aed", fontWeight: 700 }}>₹{remaining.toFixed(0)}</span> more to unlock <span style={{ fontWeight: 700 }}>Big Coupon Savings</span></>
            ) : (
              <>Add <span style={{ color: "#7c3aed", fontWeight: 700 }}>₹{remaining.toFixed(0)}</span> more to get <span style={{ fontWeight: 700 }}>Free Delivery</span></>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 8, background: "#f3f0ff", borderRadius: 99, overflow: "hidden", position: "relative" }}>
        {isFirstTier && (
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(124,58,237,0.1)", zIndex: 1 }} />
        )}

        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: isCouponBenefit ? "linear-gradient(90deg, #16a34a, #4ade80)" : isFreeDelivery ? "linear-gradient(90deg, #16a34a, #7c3aed)" : "linear-gradient(90deg, #7c3aed, #a78bfa)",
          borderRadius: 99,
          transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease",
          position: "relative",
          zIndex: 2
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)", animation: "bar-shine 3s infinite" }} />
        </div>
      </div>
      <style>{`
        @keyframes bar-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (max-width: 768px) {
          .fdb-card { border-radius: 12px; padding: 12px 16px; }
        }
      `}</style>
    </div>
  );
};

const CartItem = ({
  name, image, manufacturer, originalPrice, discountedPrice,
  discountPercentage, quantity, onQuantityChange, prescription,
  cart_id_external, productUrl, inStock,
}) => {
  const navigate = useNavigate();
  const hasSavings = originalPrice && discountedPrice && discountedPrice !== originalPrice;
  const showSavings = hasSavings && discountPercentage && !discountPercentage.startsWith("0%");

  // Helper to calculate saved amount string
  const savedAmountStr = (() => {
    if (!hasSavings) return null;
    const op = parseFloat(String(originalPrice).replace(/[^0-9.]/g, ""));
    const dp = parseFloat(String(discountedPrice).replace(/[^0-9.]/g, ""));
    if (isNaN(op) || isNaN(dp)) return null;
    const diff = op - dp;
    const symbol = String(originalPrice).includes("$") ? "$" : "Rs. ";
    return symbol + diff.toFixed(2);
  })();

  return (
    <div className="cart-item">
      <div
        className="cart-item-image"
        onClick={() => productUrl && navigate("/product/" + productUrl)}
      >
        <img
          src={"https://d1dh0rr5xj2p49.cloudfront.net/products/" + image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
          onError={(e) => { e.target.src = "/medicine-details.png"; }}
        />
        {inStock === false && (
          <div className="out-of-stock-badge">OUT OF STOCK</div>
        )}
      </div>

      <div className="cart-item-details">
        <div className="cart-item-name-row">
          <span className="cart-item-name" onClick={() => productUrl && navigate("/product/" + productUrl)}>{name}</span>
          {!cart_id_external && (
            <button
              className="remove-item-btn mobile-only"
              onClick={() => onQuantityChange(-quantity)}
            >
              <FiTrash2 />
            </button>
          )}
        </div>

        <div className="cart-item-mfg">{manufacturer || " " }</div>

        {/* Desktop Controls (Ref: Step 485) */}
        <div className="desktop-controls-row desktop-only">
          <div className="qty-pill-selector">
            <button onClick={() => onQuantityChange(-1)}>
              {quantity === 1 ? <FiTrash2 size={13} /> : <MdRemove size={16} />}
            </button>
            <span>{quantity}</span>
            <button onClick={() => onQuantityChange(1)}>
              <MdAdd size={16} />
            </button>
          </div>
          {!cart_id_external && (
            <button className="desktop-remove-link" onClick={() => onQuantityChange(-quantity)}>
              <FiTrash2 size={14} /> Remove
            </button>
          )}
        </div>

        {/* Mobile View Elements (Hides on desktop) */}
        <div className="mobile-price-container mobile-only">
          <div className="price-info-left">
            <span className="current-price">{discountedPrice}</span>
            {showSavings && <span className="original-price">{originalPrice}</span>}
          </div>
          {showSavings && (
            <span className="mobile-discount-badge">{discountPercentage} OFF</span>
          )}
        </div>

        <div className="cart-item-actions mobile-only">
          {cart_id_external ? (
            <div className="qty-display">Qty: {quantity}</div>
          ) : (
            <div className="qty-pill-selector">
              <button onClick={() => onQuantityChange(-1)}>
                {quantity === 1 ? <FiTrash2 size={14} /> : <MdRemove size={18} />}
              </button>
              <span>{quantity}</span>
              <button onClick={() => onQuantityChange(1)}>
                <MdAdd size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Price Column (Ref: Step 485) */}
      <div className="cart-item-price-col desktop-only">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", height: "100%" }}>
          <span className="price-main">{discountedPrice}</span>
          
          {showSavings && (
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span className="mrp-old">{originalPrice}</span>
              <div className="you-saved-badge">
                You saved {savedAmountStr}
              </div>
            </div>
          )}
          
          {prescription && (
            <div className="rx-badge" style={{ marginTop: 8 }}>Prescription Required</div>
          )}
        </div>
      </div>
    </div>
  );
};



const BoughtTogetherCard = ({ product, onAdd, onUpdate }) => {
  const navigate = useNavigate();
  return (
  <div style={{
    background: "transparent",
    borderRadius: 16,
    padding: "14px",
    border: "1.5px solid #f0eeff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124,58,237,0.04)",
    position: "relative",
  }}
    onClick={() => product.productUrl && navigate("/product/" + product.productUrl)}
    onMouseOver={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 28px rgba(124,58,237,0.12)";
      e.currentTarget.style.borderColor = "#c4b5fd";
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.04)";
      e.currentTarget.style.borderColor = "#f0eeff";
    }}
  >
    <div className="fbt-image-container" style={{
      background: "rgba(255, 255, 255, 0.4)",
      borderRadius: 12,
      height: 120,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      padding: "8px",
      flexShrink: 0,
    }}>
      <img
        src={product.image}
        alt={product.name}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        onError={(e) => { e.target.src = "/medicine-details.png"; }}
      />
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#111827",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        lineHeight: 1.35,
      }}>{product.name}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#7c3aed" }}>₹{product.price.toFixed(2)}</span>
        <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through", fontWeight: 500 }}>₹{product.mrp.toFixed(2)}</span>
      </div>
    </div>
    
    {product.cartQuantity > 0 ? (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "#fff",
        border: "1.5px solid #7c3aed",
        borderRadius: 10,
        padding: "6px 12px",
        height: 38,
        boxSizing: "border-box",
        marginTop: "auto",
        flexShrink: 0,
      }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdate(product.id, product.cartQuantity - 1); }}
          style={{ 
            background: "none", border: "none", cursor: "pointer", display: "flex", 
            alignItems: "center", color: "#7c3aed", padding: 0 
          }}
        >
          {product.cartQuantity === 1 ? <FiTrash2 size={16} /> : <MdRemove size={18} />}
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>{product.cartQuantity}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdate(product.id, product.cartQuantity + 1); }}
          style={{ 
            background: "none", border: "none", cursor: "pointer", display: "flex", 
            alignItems: "center", color: "#7c3aed", padding: 0 
          }}
        >
          <MdAdd size={18} />
        </button>
      </div>
    ) : (
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(product.id); }}
        style={{
          width: "100%",
          background: "#f5f3ff",
          color: "#7c3aed",
          border: "1.5px solid #7c3aed",
          borderRadius: 10,
          padding: "9px 0",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.2s",
          marginTop: "auto",
          flexShrink: 0,
        }}
        onMouseOver={e => { e.currentTarget.style.background = "#ede9fe"; }}
        onMouseOut={e => { e.currentTarget.style.background = "#f5f3ff"; }}
      >
        <MdAdd size={16} /> Add
      </button>
    )}
  </div>
  );
};



const FrequentlyBoughtTogether = ({ onAdd, onUpdate, cartItems = [], categoryKey = "dealsForTheDay" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  // Responsive cards per page
  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth <= 640) setCardsPerPage(2);
      else if (window.innerWidth <= 1023) setCardsPerPage(3);
      else setCardsPerPage(4);
    };
    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  const totalPages = Math.ceil(products.length / cardsPerPage);

  const goNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };
  const goPrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleProducts = products.slice(
    currentPage * cardsPerPage,
    currentPage * cardsPerPage + cardsPerPage
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getFooterProducts();

        const list = data[categoryKey]?.slice(0, 20) || [];

        const normalized = list.map(item => ({
          product_id: item.product_id,
          productName: item.label,
          product_name_url: item.product_name_url,
          productPriceNew: parseFloat(item.product_pricing_new || 0),
          productPriceOld: parseFloat(item.product_pricing_old || 0),
          manufacturer: item.manufacturer || "",
          inStock: item.inStock === true || item.inStock === 1 || item.inStock === "1",
          rc: item.rc === undefined ? 1 : Number(item.rc),
          images: item.first_image_url
            ? [{ img: item.first_image_url }]
            : []
        }));

        setProducts(normalized);
      } catch (err) {
        console.error("FBT fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryKey]);

  useEffect(() => {
    setCurrentPage(0);
  }, [cardsPerPage]);

  if (!loading && products.length === 0) return null;

  return (
    <div style={{ marginTop: 12, marginBottom: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BsStars size={18} color="#7c3aed" />
          <h2
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
            }}
          >
            Frequently Bought Together
          </h2>
        </div>

        {totalPages > 1 && (
          <div className="fbt-nav-arrows" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            
            <button onClick={goPrev} style={btnStyle}>
              <MdChevronLeft size={20} color="#7c3aed" />
            </button>
            <button onClick={goNext} style={btnStyle}>
              <MdChevronRight size={20} color="#7c3aed" />
            </button>
          </div>
        )}
      </div>

      <div
        className="fbt-scroll-container"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cardsPerPage}, 1fr)`,
          gap: 14,
          padding: "4px 2px 12px",
        }}
      >
        {loading ? (
          <>
            <style>{`
              @keyframes fbt-shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
              }
              .fbt-skel {
                background: linear-gradient(90deg, #f3f0fb 0%, #e8e4f3 50%, #f3f0fb 100%);
                background-size: 200px 100%;
                animation: fbt-shimmer 1.4s ease-in-out infinite;
                border-radius: 8px;
              }
            `}</style>
            {Array.from({ length: cardsPerPage }).map((_, i) => (
              <div key={i} className="fbt-card-wrapper" style={{
                background: "transparent",
                borderRadius: 16,
                padding: 14,
                border: "1.5px solid #f0eeff",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                boxSizing: "border-box",
              }}>
                <div className="fbt-skel" style={{ height: 120, borderRadius: 12 }} />
                <div className="fbt-skel" style={{ height: 14, width: "80%", marginTop: 4 }} />
                <div className="fbt-skel" style={{ height: 12, width: "50%" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  <div className="fbt-skel" style={{ height: 16, width: 60 }} />
                  <div className="fbt-skel" style={{ height: 12, width: 40, marginTop: 2 }} />
                </div>
                <div className="fbt-skel" style={{ height: 34, borderRadius: 10, marginTop: "auto" }} />
              </div>
            ))}
          </>
        ) : (
          visibleProducts.map((p) => {
            const imageUrl = p.images?.length
              ? `https://d1dh0rr5xj2p49.cloudfront.net/products/${p.images[0].img}`
              : "/medicine-details.png";

            const currentCartItem = cartItems.find(item => item.id === p.product_id);
            const cartQuantity = currentCartItem ? currentCartItem.quantity : 0;

            const productData = {
              id: p.product_id,
              name: p.productName,
              price: parseFloat(p.productPriceNew || 0),
              mrp: parseFloat(p.productPriceOld || 0),
              image: imageUrl,
              productUrl: p.product_name_url,
              cartQuantity: cartQuantity,
              raw: p,
            };

            return (
              <div key={p.product_id} className="fbt-card-wrapper" style={{ display: "flex" }}>
                <BoughtTogetherCard
                  product={productData}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  background: "#fff",
  border: "1.5px solid #f0eeff",
  borderRadius: "50%",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(124,58,237,0.06)",
};

const SummaryRow = ({ label, value, highlight, strike, green }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "5px 0" }}>
    <span style={{ fontSize: 13, color: "#6b7280", overflowWrap: "break-word", flex: 1 }}>{label}</span>
    <span style={{
      fontSize: 13, fontWeight: highlight ? 700 : 500,
      color: green ? "#16a34a" : "#111827",
      textDecoration: strike ? "line-through" : "none",
    }}>{value}</span>
  </div>
);

/* ─── Tracking ───────────────────────────────────────────────────────────── */
const Tracking = ({ trackDetails }) => {
  const uniqueActions = trackDetails.reduce((acc, curr) => {
    if (!acc.find((item) => item.strAction === curr.strAction)) acc.push(curr);
    return acc;
  }, []);

  const formatDateTime = (date, time) => {
    const d = `${date.slice(0, 2)}/${date.slice(2, 4)}/${date.slice(4)}`;
    const t = `${time.slice(0, 2)}:${time.slice(2)}`;
    return `${d} ${t}`;
  };

  return (
    <div style={{ padding: "8px 0" }}>
      {uniqueActions.length > 0 ? (
        <div style={{ position: "relative", paddingLeft: 20 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#ede9fe", borderRadius: 1 }} />
          {uniqueActions.reverse().map((item, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: 16, paddingLeft: 16 }}>
              <div style={{ position: "absolute", left: -5, top: 4, width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#7c3aed" : "#c4b5fd", border: "2px solid #fff", boxShadow: "0 0 0 2px #ede9fe" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.strAction}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{formatDateTime(item.strActionDate, item.strActionTime)}</div>
              {item.strOrigin && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{item.strOrigin}</div>}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "12px 0" }}>No tracking info available</p>
      )}
    </div>
  );
};

/* ─── Offers Selection Modal ────────────────────────────────────────────── */
const OffersSelectionModal = ({ open, onClose, onApplyCode, cartId, totalAmt, appliedOfferTitle }) => {
  const [offers, setOffers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [localCode, setLocalCode] = React.useState("");
  const [expandedTerms, setExpandedTerms] = React.useState({});

  React.useEffect(() => {
    if (open) { loadDynamicOffers(); }
  }, [open]);

  const loadDynamicOffers = async () => {
    setLoading(true);
    try {
      const data = await getOffers(1);
      if (data && data.offers) { setOffers(data.offers); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 200000, backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(420px, 100vw)", background: "#f8f9fa",
        boxShadow: "-10px 0 40px rgba(0,0,0,0.15)",
        zIndex: 200001, display: "flex", flexDirection: "column",
        animation: "slideInRight 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "18px 20px", background: "#fff", flexShrink: 0, gap: 12 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" }}>
            <MdArrowBack size={24} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", flex: 1 }}>Coupons for you</span>
        </div>
        <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "4px" }}>
            <input type="text" placeholder="Enter coupon code" value={localCode} onChange={(e) => setLocalCode(e.target.value.toUpperCase())} style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: 14, fontFamily: "inherit" }} />
            <button onClick={() => { if (localCode) onApplyCode(localCode); }} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "0 16px", fontWeight: 800, fontSize: 14, cursor: "pointer", letterSpacing: 0.5, fontFamily: "inherit", borderRadius: "0 8px 8px 0" }}>APPLY</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Available Offers</div>
          {(() => {
            if (loading) return (
              <>
                <style>{`
                  @keyframes skeletonPulse {
                    0% { background-position: -200px 0; }
                    100% { background-position: calc(200px + 100%) 0; }
                  }
                  .skeleton-box {
                    background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
                    background-size: 200px 100%;
                    animation: skeletonPulse 1.5s ease-in-out infinite;
                    border-radius: 6px;
                  }
                `}</style>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6", marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="skeleton-box" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                        <div>
                          <div className="skeleton-box" style={{ width: 100, height: 14, marginBottom: 6 }} />
                          <div className="skeleton-box" style={{ width: 140, height: 10 }} />
                        </div>
                      </div>
                      <div className="skeleton-box" style={{ width: 70, height: 30, borderRadius: 8 }} />
                    </div>
                    <div style={{ padding: "8px 16px" }}>
                      <div className="skeleton-box" style={{ width: "100%", height: 28, borderRadius: 6 }} />
                    </div>
                    <div style={{ padding: "16px" }}>
                      <div className="skeleton-box" style={{ width: "80%", height: 14, marginBottom: 8 }} />
                      <div className="skeleton-box" style={{ width: "60%", height: 12 }} />
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", justifyContent: "center" }}>
                      <div className="skeleton-box" style={{ width: 140, height: 12 }} />
                    </div>
                  </div>
                ))}
              </>
            );
            const processedOffers = offers.map((offer, idx) => {
              let code = "MEDINGEN";
              if (offer.title.toLowerCase().includes("buy 2")) code = "B2G1FREE";
              else if (offer.title.toLowerCase().includes("500")) code = "FREEDEL500";
              else if (offer.title.toLowerCase().includes("1000")) code = "MIGSAVER";
              else code = "OFFER" + (idx + 1);
              let OfferIcon = MdLocalOffer;
              if (offer.title.toLowerCase().includes("delivery")) OfferIcon = MdLocalShipping;
              else if (offer.title.toLowerCase().includes("buy")) OfferIcon = MdShoppingCart;
              return { offer, idx, code, OfferIcon };
            });
            const filteredOffers = processedOffers.filter(item => localCode === "" || item.code.toLowerCase().includes(localCode.toLowerCase()));
            if (filteredOffers.length === 0) {
              return <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af", fontSize: 14 }}>No offers matching "{localCode}" currently available.</div>;
            }
            return filteredOffers.map(({ offer, idx, code, OfferIcon }) => {
              let isAvailable = true;
              let lockMessage = "";
              const isApplied = appliedOfferTitle && (appliedOfferTitle.toLowerCase() === offer.title.toLowerCase() || appliedOfferTitle.toLowerCase().includes(code.toLowerCase()));

              if (code === "B2G1FREE") {
                isAvailable = false;
                lockMessage = "LOCKED: Only applicable by Medingen team";
              } else if (totalAmt >= 1000) {
                if (code !== "MIGSAVER") { isAvailable = false; lockMessage = "Locked: Best Offer (MIGSAVER) is active"; }
              } else if (totalAmt >= 500) {
                if (code === "MIGSAVER") { isAvailable = false; lockMessage = "Locked: Add more to reach ₹1000"; }
                else if (code !== "FREEDEL500") { isAvailable = false; lockMessage = "Locked: FREEDEL500 is active"; }
              } else {
                if (code === "FREEDEL500" || code === "MIGSAVER") { isAvailable = false; lockMessage = "Locked: Reach ₹500 for savings"; }
              }

              return (
                <div key={idx} style={{ background: "#fff", borderRadius: 16, border: isApplied ? "1.5px solid #16a34a" : (isAvailable ? "1px dashed #c4b5fd" : "1px solid #f3f4f6"), marginBottom: 16, opacity: isAvailable || isApplied ? 1 : 0.7, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "16px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: isApplied ? "#16a34a" : (isAvailable ? "#8b5cf6" : "#9ca3af"), fontSize: 16 }}><OfferIcon /></div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: 1 }}>{code}</div>
                        {!isAvailable && !isApplied && <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginTop: 2 }}>{lockMessage}</div>}
                        {isApplied && <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>CURRENTLY APPLIED</div>}
                      </div>
                    </div>
                    <button
                      disabled={!isAvailable || isApplied}
                      onClick={() => onApplyCode(code)}
                      style={{
                        background: isApplied ? "#f0fdf4" : (isAvailable ? "#f5f3ff" : "#f9fafb"),
                        border: isApplied ? "1px solid #16a34a" : (isAvailable ? "1px solid #7c3aed" : "1px solid #e5e7eb"),
                        color: isApplied ? "#16a34a" : (isAvailable ? "#7c3aed" : "#9ca3af"),
                        fontWeight: 800, fontSize: 13, cursor: isAvailable && !isApplied ? "pointer" : "not-allowed",
                        fontFamily: "inherit", padding: "6px 14px", borderRadius: 8
                      }}
                    >
                      {isApplied ? "✓ APPLIED" : (isAvailable ? "APPLY" : "LOCKED")}
                    </button>
                  </div>
                  <div style={{ background: (isAvailable || isApplied) ? "#f3e8ff" : "#f9fafb", color: (isAvailable || isApplied) ? "#7c3aed" : "#9ca3af", padding: "8px 16px", fontSize: 11, fontWeight: 700 }}>
                    {isAvailable ? "Get maximum savings on your purchase" : "Total threshold required"}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{offer.title}</div>
                    {!expandedTerms[idx] ? (
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {offer.description?.split(/(?=\\n|\n|\b1\.\s)/)[0]?.replace(/Terms\s*&\s*Conditions:\s*/i, "") || "Apply this offer during checkout to get maximum benefits."}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, marginTop: 8, textAlign: "justify" }}>
                        <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>Terms & Conditions:</div>
                        <div>{(() => {
                          let text = offer.description || "";
                          text = text.replace(/Terms\s*&\s*Conditions:\s*/i, "");
                          let lines = [];
                          if (text.includes("\\n")) lines = text.split("\\n");
                          else if (text.includes("\n")) lines = text.split("\n");
                          else lines = text.split(/(?=\b\d+\.\s)/);
                          return lines.map((line, i) => { let pt = line.trim(); if (!pt) return null; return <div key={i} style={{ marginBottom: 6 }}>{pt}</div>; });
                        })()}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", justifyContent: "center" }}>
                    <button onClick={() => setExpandedTerms(p => ({ ...p, [idx]: !p[idx] }))} style={{ background: "none", border: "none", color: isAvailable ? "#8b5cf6" : "#9ca3af", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {expandedTerms[idx] ? "Hide Terms and Conditions" : "Terms and Conditions"}
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </>
  );
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatPrescriptionDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.split(" 00:")[0];
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  } catch (e) { return dateStr; }
};

/* ─── Prescription Upload Modal ─────────────────────────────────────────── */
const PrescriptionUploadModal = ({ open, onClose, onPrescriptionSelected }) => {
  const [patientName, setPatientName] = React.useState("");
  const [medicineName, setMedicineName] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [savedPrescriptions, setSavedPrescriptions] = React.useState([]);
  const [loadingSaved, setLoadingSaved] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const rxScrollRef = React.useRef(null);
  const navigate = useNavigate();

  const scrollRx = (dir) => {
    if (rxScrollRef.current) {
      const scrollAmt = rxScrollRef.current.offsetWidth * 0.8;
      rxScrollRef.current.scrollBy({ left: dir === "left" ? -scrollAmt : scrollAmt, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    if (open) { 
      loadSavedPrescriptions(); 
      setSelectedFile(null);
      setPatientName("");
      setMedicineName("");
    }
  }, [open]);

  const loadSavedPrescriptions = async () => {
    setLoadingSaved(true);
    try {
      const data = await listPrescriptions(navigate);
      setSavedPrescriptions(data || []);
    } catch (e) {
      console.error("Error loading prescriptions", e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: "Please select a file under 10MB." });
      return;
    }
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    Swal.fire({ 
      title: "Processing...", 
      text: "Securing your prescription...", 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    try {
      const fileName = await uploadFile(selectedFile, "prescription");
      if (fileName) {
        const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
        const nameToUse = patientName.trim() || ("Prescription_" + today);
        const result = await updatePrescription(fileName, nameToUse, new Date().toISOString().split("T")[0]);
        if (result && result.prescription_id) {
          onPrescriptionSelected(result.prescription_id);
          Swal.close();
          onClose();
        }
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300000, backdropFilter: "blur(6px)" }} />
      <div onClick={e => e.stopPropagation()} className="prescription-modal-content" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(520px, 95vw)", background: "#fff", borderRadius: 24, padding: "28px",
        zIndex: 300001, display: "flex", flexDirection: "column", gap: 24,
        boxShadow: "0 28px 80px rgba(0,0,0,0.22)", animation: "rx-scaleIn 0.3s ease",
        boxSizing: "border-box"
      }}>
        {/* Mobile Handle */}
        <div className="mobile-only" style={{ height: 5, width: 40, background: "#e5e7eb", borderRadius: 3, margin: "-12px auto 8px", flexShrink: 0 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Upload New Prescription</h2>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MdClose size={20} color="#6b7280" />
          </button>
        </div>

        <div onClick={() => fileInputRef.current.click()} style={{ 
          border: selectedFile ? "2px solid #16a34a" : "2px dashed #c4b5fd", 
          borderRadius: 20, padding: "30px 20px", textAlign: "center", 
          background: selectedFile ? "#f0fdf4" : "#f9f8ff", 
          cursor: "pointer", transition: "all 0.2s ease" 
        }} onMouseOver={e => { if (!selectedFile) { e.currentTarget.style.background = "#f3f0ff"; e.currentTarget.style.borderColor = "#7c3aed"; } }} 
           onMouseOut={e => { if (!selectedFile) { e.currentTarget.style.background = "#f9f8ff"; e.currentTarget.style.borderColor = "#c4b5fd"; } }}>
          <div style={{ background: "#fff", width: 52, height: 52, borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,58,237,0.12)" }}>
            {selectedFile ? <MdCheckCircle size={28} color="#16a34a" /> : <MdCloudUpload size={26} color="#7c3aed" />}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: selectedFile ? "#16a34a" : "#4b5563", marginBottom: 6 }}>
            {selectedFile ? `File Selected: ${selectedFile.name}` : <>Drag and drop your prescription or <span style={{ color: "#7c3aed", borderBottom: "1.5px solid #7c3aed" }}>browse files</span></>}
          </div>
          <div style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 500 }}>
            {selectedFile ? "Click here to change the selection" : "Supported: PDF, JPG, PNG (Max 10MB)"}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf" />
        </div>

        <div className="rx-modal-input-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4b5563" }}>Patient Name</label>
            <input type="text" placeholder="e.g. Rahul Sharma" value={patientName} onChange={e => setPatientName(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4b5563" }}>Medicine <span style={{ fontWeight: 500, color: "#9ca3af" }}>(Optional)</span></label>
            <input type="text" placeholder="e.g. Metformin" value={medicineName} onChange={e => setMedicineName(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>Choose from Saved Prescriptions</div>
            <div className="desktop-only" style={{ display: "flex", gap: 6 }}>
              <button onClick={() => scrollRx("left")} style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #f0eeff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#7c3aed", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}><MdChevronLeft size={18} /></button>
              <button onClick={() => scrollRx("right")} style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "1px solid #f0eeff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#7c3aed", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}><MdChevronRight size={18} /></button>
            </div>
          </div>
          <div 
            ref={rxScrollRef}
            className="rx-cards-container"
            style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "thin" }}
          >
            <style>{`
              .rx-cards-container { scroll-behavior: smooth; }
              .rx-cards-container::-webkit-scrollbar { height: 5px; }
              .rx-cards-container::-webkit-scrollbar-track { background: #f3f0fb; border-radius: 10px; }
              .rx-cards-container::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 10px; }
            `}</style>
            {loadingSaved ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ minWidth: 100 }}>
                  <div className="skel-box" style={{ width: 100, height: 100, borderRadius: 16, marginBottom: 8 }} />
                  <div className="skel-box" style={{ width: "80%", height: 12, borderRadius: 6, marginBottom: 6 }} />
                  <div className="skel-box" style={{ width: "60%", height: 10, borderRadius: 6 }} />
                </div>
              ))
            ) : savedPrescriptions.length > 0 ? (
              savedPrescriptions.map((p, i) => (
                <div key={i} onClick={() => onPrescriptionSelected(p.prescription_id)} style={{ minWidth: 100, cursor: "pointer" }}>
                  <div style={{ width: 100, height: 100, background: "#f3f4f6", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative", overflow: "hidden", border: "1px solid #f3f4f6" }}>
                    {p.prescription_image_url ? (
                      <img src={"https://d1dh0rr5xj2p49.cloudfront.net/prescription/" + p.prescription_image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    ) : <FiFileText size={32} color="#9ca3af" />}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.prescription_name || "Prescription"}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{formatPrescriptionDate(p.prescription_date)}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "#9ca3af", padding: "10px 0" }}>No saved prescriptions found.</div>
            )}
          </div>
        </div>

        <div style={{ background: "#f9fafb", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <FiShield size={20} color="#7c3aed" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
            Your prescription will be securely stored and reviewed by our pharmacists. We follow strict HIPAA-compliant protocols.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={!selectedFile || uploading} style={{ 
            background: (!selectedFile || uploading) ? "#e5e7eb" : "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", 
            color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", 
            fontSize: 14, fontWeight: 800, cursor: (!selectedFile || uploading) ? "not-allowed" : "pointer", 
            display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease",
            boxShadow: (!selectedFile || uploading) ? "none" : "0 4px 12px rgba(124,58,237,0.25)" 
          }}>
            <MdCheckCircle size={18} /> Upload & Save
          </button>
        </div>

        <style>{`
          @keyframes rx-scaleIn { from { transform: translate(-50%, -40%) scale(0.95); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
          @keyframes rx-slide-up-mobile {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .prescription-modal-content {
            animation: rx-scaleIn 0.3s ease-out forwards;
          }
          @media (max-width: 640px) {
            .prescription-modal-content {
              top: auto !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              transform: translateY(0) !important;
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 24px 24px 0 0 !important;
              max-height: 92vh !important;
              padding: 16px 16px 30px !important;
              animation: rx-slide-up-mobile 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards !important;
            }
            .rx-modal-input-grid {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

/* ─── Empty Cart View ────────────────────────────────────────────────────── */
const EmptyCartView = ({ onAdd, onUpdate, cartItems, navigate }) => {
  return (
    <div className="empty-cart-wrapper" style={{ maxWidth: 1000, margin: "0 auto", padding: "100px 16px" }}>
      <div className="empty-cart-card" style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px 24px", textAlign: "center", background: "#fff",
        borderRadius: 32, margin: "0 auto 40px", width: "100%", maxWidth: 640,
        boxShadow: "0 12px 40px rgba(124, 58, 237, 0.06)", position: "relative",
        border: "1px solid #f0eeff", boxSizing: "border-box"
      }}>
        {/* Visual Decoration */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <div style={{
            width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.02) 70%, transparent 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative"
          }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(124,58,237,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V10Z" stroke="#7c3aed" strokeWidth="1.5" />
                <circle cx="12" cy="14" r="1.5" fill="#7c3aed" />
              </svg>
            </div>
          </div>
          {/* Subtle Accent Glows */}
          <div style={{ position: "absolute", top: -10, right: -10, width: 30, height: 30, borderRadius: "50%", background: "rgba(124,58,237,0.08)", filter: "blur(10px)" }} />
          <div style={{ position: "absolute", bottom: -5, left: -5, width: 40, height: 40, borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(12px)" }} />
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 16, letterSpacing: "-0.02em" }}>Your Cart is Empty!</h2>
        <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 400, lineHeight: 1.5, marginBottom: 40, fontWeight: 500 }}>
          Looks like you haven't added anything to your cart yet.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
            color: "#fff", border: "none", borderRadius: 99,
            padding: "18px 56px", fontSize: 17, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 10px 25px rgba(124, 58, 237, 0.25)",
            transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: 10
          }}
          onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 30px rgba(124,58,237,0.35)"; }}
          onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(124,58,237,0.25)"; }}
        >
          Continue Shopping
        </button>
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "40px" }}>
        <FrequentlyBoughtTogether onAdd={onAdd} onUpdate={onUpdate} cartItems={cartItems} />
      </div>

      <style>{`
        @keyframes empty-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

const OrderProgressSkeleton = () => (
  <div className="order-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 40px", minHeight: "100vh", background: "#f9fafb" }}>
    <div style={{ width: 140, height: 24, borderRadius: 6, background: "#e5e7eb", marginBottom: 24, marginLeft: 4, animation: "skel-pulse 1.4s infinite" }} />

    <div className="cart-layout">
      <div className="right-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skel-box" style={{ height: 90, borderRadius: 16 }} />
        <div className="skel-box" style={{ height: 160, borderRadius: 16 }} />
        <div className="skel-box" style={{ height: 220, borderRadius: 16 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="cart-section" style={{ padding: "24px" }}>
          <div className="skel-box" style={{ width: "35%", height: 20, marginBottom: 24 }} />
          {[1, 2].map(i => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: i === 1 ? "1px solid #f3f4f6" : "none" }}>
              <div className="skel-box" style={{ width: 80, height: 80, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="skel-box" style={{ width: "70%", height: 18, marginBottom: 10 }} />
                <div className="skel-box" style={{ width: "40%", height: 14, marginBottom: 12 }} />
                <div className="skel-box" style={{ width: "25%", height: 16 }} />
              </div>
              <div className="skel-box" style={{ width: 60, height: 32, borderRadius: 8, alignSelf: "center" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const OrderProgress = () => {
  const { dispatch } = useCart();
  const [cartStatus, setCartStatus] = useState("active");
  const [paymentmode, setpaymentmode] = useState(null);
  const [cartId, setCartId] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [prescriptionDetails, setPrescriptionDetails] = useState({});
  const [trackingDetails, setTrackingDetails] = useState([]);
  const [offerTitle, setOfferTitle] = useState("");
  const [orderSummary, setOrderSummary] = useState({
    itemsCount: 0,
    totalMRP: "Rs. 0",
    totalPercentageSaved: "0%",
    totalSavings: "Rs. 0",
    migCoins: "0 Coins",
    totalAmount: 0,
    total_selling_price: "",
    total_shipping_charge: 0,
    cod_charge: 0,
  });
  const [deliveryAddress, setDeliveryAddress] = useState({ addressLine1: "", addressLine2: "" });
  const [progressSteps, setProgressSteps] = useState([
    { label: "Place Order", status: "pending" },
    { label: "Confirmation", status: "pending" },
    { label: "Payment", status: "pending" },
    { label: "Delivery", status: "pending" },
  ]);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showAddressComponent, setShowAddressComponent] = useState(false);
  const [showPrescriptionComponent, setShowPrescriptionComponent] = useState(false);
  const [prescriptionChoice, setPrescriptionChoice] = useState("donthave");
  const [prescriptionValidConfirmed, setPrescriptionValidConfirmed] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showPrescriptionError, setShowPrescriptionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prescriptionRequiredCount, setPrescriptionRequiredCount] = useState(0);

  const location = useLocation();
  const [cart_id_external, setCartIdExternal] = useState(
    location.state && (location.state.cart_id ? location.state.cart_id : null)
  );
  const [deliveryType, setDeliveryType] = useState("normal");
  const [activeCartId, setActiveCartId] = useState(null);
  const navigate = useNavigate();

  const FREE_DELIVERY_THRESHOLD = 500;

  const load_data = async () => {
    const passedState = location.state;
    let response;
    if (passedState && passedState.cart_id) {
      response = await getCartDataForID(passedState.cart_id);
    } else {
      response = await getCartData();
    }
    if (response.status !== 200) return null;
    const data = await response.data;

    const currentStatus = data.cart_status || data.cartStatus;
    if (data.cart_id && currentStatus && currentStatus !== "active") {
      if (currentStatus === "pending_confirm") {
          navigate("/cart/pharmacist-verification", { state: location.state });
          return null;
      }
      
      if (currentStatus === "confirm") {
          if (data.paymentmode === "scanner" || data.payment_mode === "scanner") {
                navigate("/cart/pharmacist-verification/payment/place-order", {
                    state: { 
                      cart_id: data.cart_id, 
                      total_amount: parseFloat(data.orderSummary?.total_selling_price?.replace?.(/[^0-9.]/g, "") || 0),
                      payment_method: "upi_scanner",
                      deliveryAddress: data.deliveryAddress,
                      coupon_savings: parseFloat(data.orderSummary?.coupon_savings?.replace?.(/[^0-9.]/g, "") || 0)
                    }
                });
                return null;
          }
          navigate("/cart/pharmacist-verification/payment", { state: { cartData: data } });
          return null;
      }

      navigate("/cart/pharmacist-verification/payment/place-order", {
        state: { 
          cart_id: data.cart_id, 
          total_amount: parseFloat(data.orderSummary?.total_selling_price?.replace?.(/[^0-9.]/g, "") || 0),
          payment_method: data.payment_mode || "cod",
          deliveryAddress: data.deliveryAddress,
          coupon_savings: parseFloat(data.orderSummary?.coupon_savings?.replace?.(/[^0-9.]/g, "") || 0)
        }
      });
      return null;
    }

    if (data.cart_id) setActiveCartId(data.cart_id);

    const countRes = await getCartCount();
    const serverCount = countRes?.cart_count || 0;
    dispatch({ type: "UPDATE_COUNT", payload: serverCount });

    if (!data.cart || !Array.isArray(data.cart)) return null;

    const filteredCart = data.cart.filter((item) => item.quantity > 0 && item.name !== "Prescription Order");
    setCartItems(filteredCart);
    const rxCount = filteredCart.filter(item => item.prescriptionRequired === "Yes").length;
    setPrescriptionRequiredCount(rxCount);
    setDeliveryAddress(data.deliveryAddress);
    const updatedSummary = { ...data.orderSummary, itemsCount: serverCount };
    setOrderSummary(updatedSummary);

    const details = data.prescriptionDetails || {};
    setPrescriptionDetails(details);
    if (Object.keys(details).length > 0) {
      setPrescriptionChoice("have");
    } else {
      setPrescriptionChoice("donthave");
    }

    const updatableStatuses = ["active", "pending_confirm", "confirm"];
    const statusToCheck = data.cart_status || data.cartStatus;
    if (updatableStatuses.includes(statusToCheck)) {
      let expectedCharge = 50; 

      if (data.deliveryAddress && data.deliveryAddress.pincode) {
        const pinString = String(data.deliveryAddress.pincode).trim();
        const firstDigit = pinString.charAt(0);
        
        if (["5", "6"].includes(firstDigit)) { expectedCharge = 50; }
        else if (["1", "2", "3", "4", "7", "8"].includes(firstDigit)) { expectedCharge = 60; }
        
        const totalAmountValue = parseFloat(data.orderSummary?.total_selling_price?.replace(/[^0-9.]/g, "") || 0);
        const freeDeliveryApplied = 
          data.offerTitle?.toLowerCase().includes("free delivery") || 
          data.offerTitle?.toLowerCase().includes("free deivery") || 
          totalAmountValue >= 500;
        
        if (freeDeliveryApplied) { expectedCharge = 0; }
      }

      const currentCharge = parseFloat(data.orderSummary?.total_shipping_charge) || 0;

      if (currentCharge !== expectedCharge) {
        try {
          await updateDeliveryCharge(data.cart_id, expectedCharge);
          return await load_data(); 
        } catch (err) { console.error("Error updating shipping:", err); }
      }

      const currentCodCharge = parseFloat(data.orderSummary?.cod_charge) || 0;
      if (currentCodCharge !== 0) {
        try {
          await updateCODCharge(data.cart_id, 0);
          return await load_data(); 
        } catch (err) { console.error("Error resetting COD charge:", err); }
      }
    }

    setTrackingDetails(data.courier_tracking?.trackDetails || []);
    setDeliveryType(data.delivery_type ? data.delivery_type : "normal");
    setOfferTitle(data.offerTitle || "");

    if (data.cart_status === "active") {
      const totalSellingPrice = parseFloat(data.orderSummary.total_selling_price?.replace(/[^0-9.]/g, "") || 0);
      let autoOfferId = 0;
      if (totalSellingPrice >= 1000) autoOfferId = 2;
      else if (totalSellingPrice >= 500) autoOfferId = 1;

      const currentOfferId = parseInt(data.offer_id) || 0;
      if (currentOfferId === 0 || currentOfferId === 1 || currentOfferId === 2) {
        if (currentOfferId !== autoOfferId) {
          try {
            await assignOfferToCart(data.cart_id, autoOfferId);
            return await load_data();
          } catch (e) { console.error("Auto offer sync failed", e); }
        }
      }
    }

    if (data.offer_id === 1) {
      setCouponCode("FREEDEL500");
      if (!data.offerTitle) setOfferTitle("Free Delivery Applied");
    } else if (data.offer_id === 2) {
      setCouponCode("MIGSAVER");
      if (!data.offerTitle) setOfferTitle("Medingen Saver Applied");
    } else if (data.offer_id === 3) {
      setCouponCode("B2G1FREE");
      if (!data.offerTitle) setOfferTitle("Buy 2 Get 1 Free Applied");
    }

    return data;
  };

  const handlePay = () => {
    if (prescriptionChoice === "have" && !prescriptionValidConfirmed) {
      setShowPrescriptionError(true);
      return;
    }
    navigate("/order-payment", {
      state: {
        total_amount: finalPayableAmount,
        mig_coins: orderSummary.migCoins,
        cart_id: cartId,
      },
    });
  };

  const handlePlaceOrder = async () => {
    try {
      if (prescriptionChoice === "have" && !prescriptionValidConfirmed && Object.keys(prescriptionDetails).length === 0) {
        setShowPrescriptionError(true);
        const el = document.getElementById("prescription-error-scroll");
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      Swal.showLoading();
      const currentCartId = cartId || activeCartId;
      const res = await placeOrder(currentCartId);

      if (res) {
        const freshRes = await getCartData();
        if (freshRes && freshRes.status === 200) {
          const data = freshRes.data;
          navigate("/cart/pharmacist-verification", {
            state: {
              cartId: data.cart_id,
              orderSummary: {
                ...data.orderSummary,
                cartItems: data.cart
              },
              pendingConfirmAt: data.pending_confirm_at || data.orderSummary?.pending_confirm_at || new Date().toISOString()
            }
          });
        }
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: res?.data?.message || "Could not place order." });
      }
    } catch (error) {
      console.error("Place order error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while placing your order." });
    } finally {
      Swal.close();
    }
  };

  const handleStickyProceed = async () => {
    const isProceedDisabled = prescriptionChoice === "have" && !prescriptionValidConfirmed;
    if (isProceedDisabled) {
      setShowPrescriptionError(true);
      const el = document.getElementById("prescription-error-scroll");
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (cartStatus === "active") {
      handlePlaceOrder();
    } else {
      if (await safeCheck("confirm")) handlePay();
    }
  };

  const safeCheck = async (expectedStatus) => {
    const res = await getCartDataForID(cartId);
    const fresh = res?.data;
    if (!fresh || fresh.cartStatus !== expectedStatus) {
      Swal.fire({ icon: "warning", title: "Order Updated", text: "Your order status changed. Please review again." });
      fetchData();
      return false;
    }
    return true;
  };

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await load_data();
      if (!data || !data.cart || data.cart.length === 0 || data.orderSummary.itemsCount === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      setCartStatus(data.cartStatus);
      setpaymentmode(data.paymentmode);
      setCartId(data.cart_id);

      if (data.cartStatus === "active") {
        setProgressSteps([{ label: "Place Order", status: "pending" }, { label: "Confirmation", status: "pending" }, { label: "Payment", status: "pending" }, { label: "Delivery", status: "pending" }]);
        setConfirmationMessage("Place your order and our experts will confirm. We'll notify you when it's ready for payment.");
      } else if (data.cartStatus === "pending_confirm") {
        navigate("/cart/pharmacist-verification", {
          state: {
            cartId: data.cart_id,
            orderSummary: {
              ...data.orderSummary,
              cartItems: data.cart
            },
            pendingConfirmAt: data.pending_confirm_at || data.orderSummary?.pending_confirm_at || new Date().toISOString()
          }
        });
        return;
      } else if (data.cartStatus === "confirm") {
        navigate("/cart/pharmacist-verification/payment", {
          state: { cartData: data }
        });
        return;
      } else if (data.cartStatus === "payment" || data.cartStatus === "dispatched") {
        setProgressSteps([{ label: "Place Order", status: "completed" }, { label: "Confirmation", status: "completed" }, { label: "Payment", status: "current" }, { label: "Delivery", status: "pending" }]);
        setConfirmationMessage("Payment confirmed. Your order is on its way!");
      } else if (data.cartStatus === "delivered") {
        setProgressSteps([{ label: "Place Order", status: "completed" }, { label: "Confirmation", status: "completed" }, { label: "Payment", status: "completed" }, { label: "Delivery", status: "current" }]);
        setConfirmationMessage("Your order has been delivered. Thank you!");
      } else if (data.cartStatus === "cancelled") {
        setProgressSteps([{ label: "Place Order", status: "completed" }, { label: "Confirmation", status: "completed" }, { label: "Payment", status: "current" }, { label: "Delivery", status: "pending" }]);
        setConfirmationMessage("Your order is cancelled.");
      }
    } catch (error) {
      console.error("Failed to fetch cart data", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => { fetchData(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData(true);
    setCartIdExternal(location.state && (location.state.cart_id ? location.state.cart_id : null));
  }, [location.state]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === "Enter") {
        if (
          document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA"
        ) {
          return;
        }

        if (!loading) {
          if (cartItems.length === 0) {
            navigate("/");
          } else {
            handleStickyProceed();
          }
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [loading, cartItems, cartStatus, prescriptionChoice, prescriptionValidConfirmed, cartId, activeCartId, navigate]);

  const handleApplyCoupon = async (codeToApply) => {
    if (!codeToApply) return;
    try {
      const res = await applyCouponAPI(codeToApply, cartId);
      if (res) { await fetchData(); }
    } catch (e) { console.error("Error applying coupon", e); }
  };

  const handleQuantityChange = async (id, change) => {
    let nextCartItems = cartItems.map((item) => {
      if (item.id === id) {
        const newQuantity = Math.max(item.quantity + change, 0);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    const targetItem = nextCartItems.find(item => item.id === id);
    const newQty = targetItem ? targetItem.quantity : 0;

    setCartItems(nextCartItems.filter(item => item.quantity > 0));

    try {
      const quantitiesMap = {};
      nextCartItems.forEach(item => {
        quantitiesMap[String(item.id)] = item.quantity;
      });

      await updateCartData(quantitiesMap, cartId);
      await fetchData(); // Final sync for totals
    } catch (error) {
      console.error("Failed to auto-update cart", error);
      fetchData(); // Sync back on error
    }
  };


  const handleAddressUpdate = async (addressId) => {
    try {
      await updateDeliveryAddress(addressId, cartId);
      const data = await load_data();
      setDeliveryAddress(data.deliveryAddress);
      setShowAddressComponent(false);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update delivery address." });
    }
  };

  const handlePrescriptionUpdate = async (prescription_id) => {
    try {
      await updateChoosePrescription(prescription_id, cartId);
      const data = await load_data();
      setPrescriptionDetails(data.prescriptionDetails);
      setShowPrescriptionComponent(false);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update prescription." });
    }
  };

  const handleRemovePrescription = async () => {
    try {
      const cartId = activeCartId || cart_id_external;
      if (!cartId) { throw new Error("Cart ID not found."); }
      await removePrescriptionFromCart(cartId);
      await load_data();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to remove prescription." });
    }
  };

  const totalSavingsNum = orderSummary.totalSavings || "Rs. 0";
  const coinsNum = orderSummary.migCoins || "0 Coins";
  const totalAmt = (() => {
    if (orderSummary.total_selling_price) {
      const match = String(orderSummary.total_selling_price).match(/[\d,]+\.?\d*/g);
      if (match) {
        const v = parseFloat(match[match.length - 1].replace(/,/g, ""));
        if (v > 0) return v;
      }
    }
    const total = parseFloat(orderSummary.totalAmount) || 0;
    const shipping = parseFloat(orderSummary.total_shipping_charge) || 0;
    const cod = parseFloat(orderSummary.cod_charge) || 0;
    return Math.max(0, total - shipping - cod);
  })();

  const getDerivedDeliveryCharge = () => {
    // Force free delivery for orders above 1000 or when offer is active
    const isOfferActive = totalAmt >= 1000 || offerTitle?.toLowerCase().includes("1000") || offerTitle?.toLowerCase().includes("free deivery");
    if (isOfferActive) return 0;

    if (orderSummary.total_shipping_charge) {
      const charge = parseFloat(orderSummary.total_shipping_charge);
      if (!isNaN(charge)) return charge;
    }
    if (totalAmt >= FREE_DELIVERY_THRESHOLD) return 0;
    if (deliveryAddress && deliveryAddress.pincode) {
      const pin = String(deliveryAddress.pincode).trim();
      const firstDigit = pin.charAt(0);
      return ["1", "2", "3", "4", "7", "8"].includes(firstDigit) ? 60 : 50;
    }
    return 50;
  };

  const finalPayableAmount = (() => {
    // totalAmt is the items total (product selling price)
    let shipping = getDerivedDeliveryCharge();
    const cod = parseFloat(orderSummary.cod_charge) || 0;
    
    // Apply "Orders above 1000, free delivery + 5% discount"
    let extraDiscount = 0;
    const isOfferActive = totalAmt >= 1000 || offerTitle?.toLowerCase().includes("1000") || offerTitle?.toLowerCase().includes("free deivery");

    if (isOfferActive) {
      extraDiscount = totalAmt * 0.05;
      shipping = 0;
    }

    return totalAmt - extraDiscount + shipping + cod;
  })();

  const handleAddStaticProduct = async (productId) => {
    try {
      const userData = getUser();
      if (!userData.isLoggedIn) { navigate("/login"); return; }
      await addToCart(productId, 0, 1, navigate);
      await fetchData();
    } catch (error) {
      console.error("Failed to add product", error);
      Swal.close();
      Swal.fire({ icon: "error", title: "Error", text: "Failed to add product to cart." });
    }
  };

  const handleUpdateStaticProduct = async (productId, newQuantity) => {
    try {
      const userData = getUser();
      if (!userData.isLoggedIn) { navigate("/login"); return; }
      
      const quantitiesMap = {};
      cartItems.forEach(item => {
        quantitiesMap[String(item.id)] = item.quantity;
      });
      quantitiesMap[String(productId)] = newQuantity;

      await updateCartData(quantitiesMap, cartId);
      await fetchData();
    } catch (error) {
      console.error("Failed to update product", error);
    }
  };

  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: "Clear Cart?",
      text: "Are you sure you want to remove all items from your cart?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "No, keep them"
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        
        // Build a quantities map with all items set to 0 to clear them in the DB
        const quantitiesMap = {};
        cartItems.forEach(item => {
          quantitiesMap[String(item.id)] = 0;
        });

        await updateCartData(quantitiesMap, cartId);
        await fetchData();
        Swal.close();
      } catch (error) {
        console.error("Failed to clear cart", error);
        Swal.fire("Error", "Could not clear cart. Try again later.", "error");
      }
    }
  };

  if (showPrescriptionComponent) { return <UploadPrescription choosePrescription={handlePrescriptionUpdate} />; }
  if (showAddressComponent) { return <SavedAddress chooseAddress={handleAddressUpdate} />; }

  return (
    <>
      <Helmet>
        <title>Your Cart | Medingen</title>
        <meta name="description" content="Review and place your order on Medingen." />
      </Helmet>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .order-page * {  font-family: 'Inter', sans-serif; }
        .cart-section { background: #fff; border-radius: 16px; border: 1px solid #f0eeff; overflow: hidden; }
        
        /* New Universal Cart Item Styles */
        .mobile-only { display: none !important; }
        .desktop-only { display: flex !important; }

        .cart-item { display: flex; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; align-items: stretch; width: 100%; min-width: 0; box-sizing: border-box; }
        .cart-item-image { width: 100px; height: 100px; flex-shrink: 0; background: #fafafa; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #f0f0f0; overflow: hidden; position: relative; cursor: pointer; }
        .cart-item-details { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .cart-item-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
        .cart-item-name { font-size: 17px; font-weight: 800; color: #111827; line-height: 1.3; word-break: break-word; cursor: pointer; }
        .cart-item-mfg { font-size: 13px; color: #a78bfa; margin-bottom: 8px; font-weight: 500; }
        
        .desktop-controls-row { display: flex; align-items: center; gap: 16px; margin-top: auto; }
        .desktop-remove-link { background: none; border: none; color: #7c3aed; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 3px 6px; border-radius: 6px; transition: all 0.2s; }
        .desktop-remove-link:hover { background: #f5f3ff; color: #6d28d9; }

        .qty-pill-selector { display: inline-flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; height: 34px; }
        .qty-pill-selector button { width: 32px; height: 34px; border: none; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.2s; }
        .qty-pill-selector button:hover { background: #f9fafb; color: #111827; }
        .qty-pill-selector span { font-size: 14px; font-weight: 800; color: #111827; min-width: 32px; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; height: 34px; display: flex; align-items: center; justify-content: center; }
        
        .cart-item-price-col { min-width: 110px; flex-shrink: 0; }
        .price-main { font-size: 19px; font-weight: 900; color: #111827; }
        .mrp-old { font-size: 12.5px; color: #9ca3af; text-decoration: line-through; }
        .you-saved-badge { background: #f3f0ff; color: #7c3aed; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
        .rx-badge { background: #fff1f2; color: #e11d48; border: 1px solid #fecaca; border-radius: 6px; padding: 2px 8px; font-size: 10.5px; font-weight: 700; }

        .remove-item-btn { 
          background: none; border: none; color: #9ca3af; font-size: 12px; cursor: pointer; margin-left: 10px; 
          display: flex; align-items: center; gap: 3px; font-weight: 500; transition: color 0.2s;
        }
        .remove-item-btn:hover { color: #ef4444; }

        .out-of-stock-badge { 
          position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); color: #fff; 
          font-size: 9px; font-weight: 700; text-align: center; padding: 3px 0; letter-spacing: 0.3px; 
        }

        .coupon-input:focus { outline: none; border-color: #7c3aed !important; }
        .proceed-btn { transition: all 0.2s ease; }
        .proceed-btn:hover { background: #6d28d9 !important; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,58,237,0.35) !important; }

        @keyframes skel-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }
        .skel-box { background: #e5e7eb; border-radius: 8px; animation: skel-pulse 1.4s infinite; }

        @media (min-width: 1024px) {
          .cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 16px; align-items: start; }
        }
        @media (max-width: 1023px) {
          .cart-layout { display: flex; flex-direction: column; gap: 16px; }
          .left-panel, .right-panel { display: contents; }
          .right-panel { width: 100%; }
          .order-page { width: 100% !important; }
          .buttons-section, .desktop-only-summary-row { display: none !important; }
          
          /* Mobile Reordering to match reference image */
          .fdb-section { order: 1; }
          .savings-section { order: 2; }
          .address-section { order: 3; }
          .rx-notice-section { order: 4; }
          .items-section { order: 5; }
          .fbt-section { order: 6; }
          .rx-mgmt-section { order: 7; }
          .coupons-section { order: 8; }
          .coins-section { order: 9; }
          .summary-section { order: 10; }
          .buttons-section { order: 11; }
          .badges-section { order: 12; }
          .support-section { order: 13; }
          .tracking-section { order: 14; }
        }
        @media (max-width: 768px) {
          .order-page { padding-bottom: 80px; }
          .cart-section { border-radius: 14px; }
        }
        @media (max-width: 640px) {
          .order-page { width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; }
          .order-page-inner { padding: 10px 16px 140px !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; margin: 0 !important; }
          .order-page-inner h1 { font-size: 17px !important; font-weight: 800 !important; margin: 4px 0 14px 4px !important; color: #111827; }
          .proceed-btn { padding: 14px !important; font-size: 14px !important; border-radius: 12px !important; width: 100% !important; }

          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }

          /* Reduced Font Sizes for Common Containers */
          .cart-section, .summary-section, .rx-mgmt-section, .coupons-section { font-size: 12.5px !important; }
          
          /* Specific Child Overrides for Inline Styles */
          .rx-mgmt-section div:nth-child(1) div:nth-child(2) { font-size: 13.5px !important; } /* Section Title */
          .rx-mgmt-section label span { font-size: 12.5px !important; } /* Radio labels */
          .rx-mgmt-section button { font-size: 12.5px !important; padding: 10px !important; }
          .rx-mgmt-section .rx-confirm-text { font-size: 10.5px !important; }

          .summary-section div:nth-child(1) span { font-size: 12.5px !important; } /* Order Summary Title */
          .summary-section div:nth-child(2) span { font-size: 12px !important; } /* MRP items */
          .summary-section div:nth-last-child(3) span { font-size: 13.5px !important; } /* Order Total LABEL */
          .summary-section div:nth-last-child(3) span:last-child { font-size: 14.5px !important; } /* Order Total VALUE */
          
          .items-section.cart-section { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
          .items-section-header { 
            display: flex !important; 
            padding: 12px 14px !important; 
            background: #ffffff !important; 
            border-radius: 14px 14px 0 0 !important;
            border: 1px solid #f0eeff !important;
            border-bottom: 1px solid #f3f0fb !important;
            margin-bottom: 0 !important;
          }

          .cart-item {
            display: flex !important;
            flex-direction: row !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 12px !important;
            margin-bottom: 12px !important;
            background: #ffffff !important;
            border: 1px solid #f3f0fb !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 16px rgba(124,58,237,0.03) !important;
            position: relative !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cart-item-image {
            width: 75px !important;
            height: 75px !important;
            min-width: 75px !important;
            background: #fafafa !important;
            border-radius: 12px !important;
            border: 1px solid #f5f5f5 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .cart-item-details {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }
          .cart-item-name-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .cart-item-name {
            font-size: 14px !important;
            font-weight: 800 !important;
            color: #111827 !important;
            line-height: 1.3 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .cart-item-mfg {
            font-size: 10.5px !important;
            color: #9ca3af !important;
            font-weight: 500 !important;
          }
          .mobile-price-container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-top: 6px !important;
            width: 100% !important;
          }
          .price-info-left {
            display: flex !important;
            align-items: baseline !important;
            gap: 6px !important;
          }
          .current-price {
            font-size: 15.5px !important;
            font-weight: 900 !important;
            color: #111827 !important;
          }
          .original-price {
            font-size: 11.5px !important;
            color: #9ca3af !important;
            text-decoration: line-through !important;
          }
          .mobile-discount-badge {
            background: #f0fdf4 !important;
            color: #16a34a !important;
            font-size: 9px !important;
            font-weight: 800 !important;
            padding: 3px 8px !important;
            border-radius: 20px !important;
            border: 1px solid #bbf7d0 !important;
            white-space: nowrap !important;
          }
          .fbt-section { margin: 12px 0 !important; width: 100% !important; padding: 0 12px !important; box-sizing: border-box !important; }
          .fbt-scroll-container { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important; 
            padding: 4px 0 12px !important; 
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .fbt-scroll-container::-webkit-scrollbar { display: none; }
          .fbt-card-wrapper { 
            flex: 1 1 0% !important; 
            width: 100% !important; 
            min-width: 0 !important; 
            box-sizing: border-box !important; 
          }
          .cart-item-actions {
            margin-top: 8px !important;
            display: flex !important;
            justify-content: flex-end !important;
          }
          .qty-pill-selector {
            display: flex !important;
            align-items: center !important;
            background: #f5f7ff !important;
            border-radius: 12px !important;
            padding: 3px !important;
            height: 34px !important;
          }
          .qty-pill-selector button {
            width: 28px !important;
            height: 28px !important;
            background: #ffffff !important;
            border: none !important;
            border-radius: 9px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #7c3aed !important;
            cursor: pointer !important;
            box-shadow: 0 3px 8px rgba(124,58,237,0.08) !important;
          }
          .qty-pill-selector span {
            min-width: 26px !important;
            text-align: center !important;
            font-size: 13.5px !important;
            font-weight: 800 !important;
            color: #111827 !important;
          }
          .remove-item-btn {
            background: none !important;
            border: none !important;
            color: #d1d5db !important;
            padding: 0 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .remove-item-btn svg { width: 16px !important; height: 16px !important; }

          .out-of-stock-badge {
            position: absolute;
            bottom: 6px;
            left: 6px;
            right: 6px;
            background: rgba(0,0,0,0.6);
            color: #fff;
            font-size: 7.5px !important;
            font-weight: 800;
            text-align: center;
            padding: 3px 0;
            border-radius: 6px;
          }

          .cart-item-price-col { display: none !important; }
          
          .cart-section { width: 100% !important; margin: 0 0 12px 0 !important; border-radius: 14px !important; box-sizing: border-box !important; overflow: hidden; border: 1px solid #f0eeff; box-shadow: 0 2px 8px rgba(124,58,237,0.04); }
          .savings-section { width: 100% !important; box-sizing: border-box !important; margin-bottom: 12px !important; border-radius: 14px !important; }
          .savings-amount { font-size: 20px !important; font-weight: 900 !important; }
          .fbt-card-wrapper { width: 100% !important; }
          .fbt-scroll-container { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; padding: 4px 0 12px !important; gap: 10px !important; }
          .fbt-scroll-container::-webkit-scrollbar { display: none; }
          .tracking-section { padding: 12px !important; }
          .summary-section { padding: 16px 14px !important; }
          .badges-section { gap: 12px !important; padding: 8px 0 !important; justify-content: space-around !important; }
          .support-section { padding: 10px !important; gap: 8px !important; border-radius: 12px !important; margin-bottom: 16px; }
          .support-section div { font-size: 12px !important; }
          
          /* Sticky Bottom Bar for Mobile */
          .mobile-sticky-footer {
            position: fixed;
            bottom: 72px; 
            left: 0;
            right: 0;
            background: #ffffff;
            padding: 10px 12px;
            display: block;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
            z-index: 1000;
            border-top: 1px solid #f0eeff;
            padding-bottom: calc(10px + env(safe-area-inset-bottom));
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .sticky-footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
          }
          .sticky-footer-amount .amount-label {
            font-size: 9px;
            font-weight: 700;
            color: #9ca3af;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .sticky-footer-amount .amount-value {
            font-size: 17px;
            font-weight: 800;
            color: #7c3aed;
          }
          .sticky-proceed-btn {
            background: #7c3aed;
            color: #fff;
            border: none;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(124,58,237,0.2);
          }
          .order-page-inner { padding: 0 16px 160px !important; width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; }
          .fdb-section, .savings-section, .address-section, .rx-notice-section, .rx-mgmt-section, .coupons-section, .coins-section, .summary-section, .badges-section, .support-section, .tracking-section {
            padding-left: 12px !important;
            padding-right: 12px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .items-section.cart-section { padding: 0 12px !important; }
        }
        @media (min-width: 1024px) {
          .mobile-sticky-footer { display: none; }
        }
        @media (max-width: 480px) {
          .order-page { padding: 0 0 100px !important; width: 100% !important; }
          .cart-layout { gap: 12px; }
          .fbt-card-wrapper { flex: 0 0 145px !important; }
          .empty-cart-wrapper { padding: 24px 16px 160px !important; width: 100% !important; box-sizing: border-box !important; }
        }
        .animate-spin {
          animation: spin-kf 1s linear infinite;
        }
        @keyframes spin-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <AddressSelectionModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        cartId={cartId}
        onAddressSelected={() => { setShowAddressModal(false); fetchData(); }}
      />
      <OffersSelectionModal
        open={showOffersModal}
        onClose={() => setShowOffersModal(false)}
        cartId={cartId}
        totalAmt={totalAmt}
        appliedOfferTitle={offerTitle}
        onApplyCode={async (code) => { setCouponCode(code); await handleApplyCoupon(code); setShowOffersModal(false); }}
      />
      <PrescriptionUploadModal
        open={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onPrescriptionSelected={(id) => { handlePrescriptionUpdate(id); setPrescriptionChoice("have"); setShowPrescriptionModal(false); }}
      />
      <div className="order-page" style={{ background: "#f5f3fb", height: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
        {cart_id_external ? (
          <Header title={"Order ID: " + cart_id_external} maxWidth={1200} breadcrumbPadding="0 16px" />
        ) : (
          <Header title="Your Cart" maxWidth={1200} breadcrumbPadding="0 16px" />
        )}

        {loading ? (
          <OrderProgressSkeleton />
        ) : cartItems.length === 0 ? (
          <EmptyCartView onAdd={handleAddStaticProduct} onUpdate={handleUpdateStaticProduct} cartItems={cartItems} navigate={navigate} />
        ) : (
          <div className="order-page-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", boxSizing: "border-box" }}>
            <h1 className="desktop-only-title" style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16 }}>
              Your Cart{" "}
              {orderSummary.itemsCount > 0 && (
                <span style={{ fontSize: 18, color: "#7c3aed" }}>({orderSummary.itemsCount} Items)</span>
              )}
            </h1>

            <div className="cart-layout">
              {/* ── LEFT COLUMN ── */}
              <div className="left-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <div className="fdb-section">
                  <FreeDeliveryBar
                    totalAmt={totalAmt}
                    threshold={FREE_DELIVERY_THRESHOLD}
                  />
                </div>

                {prescriptionRequiredCount > 0 && prescriptionChoice === "donthave" && (
                  <div className="rx-notice-section" style={{
                    background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 16,
                    padding: "16px 20px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 12,
                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ background: "#fff", padding: 8, borderRadius: 12, display: "flex", color: "#e11d48", border: "1px solid #fecaca" }}>
                        <FiFileText size={20} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#991b1b" }}>
                        Prescription Required for {prescriptionRequiredCount} item{prescriptionRequiredCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "7px 14px", borderRadius: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      REQUIRED
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="items-section cart-section">
                  <div className="items-section-header" style={{ padding: "16px 20px 8px", borderBottom: "1px solid #f3f0fb", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Your Items</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button 
                          onClick={() => fetchData(true)}
                          title="Refresh Cart"
                          style={{ 
                            background: "#f5f3ff", border: "none", color: "#7c3aed", 
                            cursor: "pointer", display: "flex", alignItems: "center", 
                            padding: "6px", borderRadius: "10px", transition: "all 0.2s",
                            boxShadow: "0 2px 6px rgba(124,58,237,0.08)"
                          }}
                          onMouseOver={e => e.currentTarget.style.background = "#ede9fe"}
                          onMouseOut={e => e.currentTarget.style.background = "#f5f3ff"}
                        >
                          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button 
                          onClick={handleClearCart}
                          title="Clear All"
                          style={{ 
                            background: "#fff1f2", border: "none", color: "#e11d48", 
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 10px", borderRadius: "10px", transition: "all 0.2s",
                            fontSize: "11px", fontWeight: 700,
                            boxShadow: "0 2px 6px rgba(225,29,72,0.06)"
                          }}
                          onMouseOver={e => e.currentTarget.style.background = "#ffe4e6"}
                          onMouseOut={e => e.currentTarget.style.background = "#fff1f2"}
                        >
                          <FiTrash2 size={13} /> Clear All
                        </button>
                      </div>
                    </div>
                    <span className="desktop-only" style={{ fontSize: 12, color: "#9ca3af" }}>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
                  </div>

                  {cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      image={item.image}
                      name={item.name}
                      manufacturer={item.manufacturer}
                      originalPrice={item.originalPrice}
                      discountedPrice={item.discountedPrice}
                      discountPercentage={item.discountPercentage}
                      prescription={item.prescriptionRequired === "Yes" && Object.keys(prescriptionDetails).length === 0}
                      quantity={item.quantity}
                      cart_id_external={cart_id_external}
                      productUrl={item.product_name_url}
                      inStock={item.inStock}
                      onQuantityChange={(change) => handleQuantityChange(item.id, change)}
                    />
                  ))}

                </div>

                <div className="fbt-section">
                  <FrequentlyBoughtTogether onAdd={handleAddStaticProduct} onUpdate={handleUpdateStaticProduct} cartItems={cartItems} />
                </div>


                {(cartStatus === "payment" || cartStatus === "dispatched" || cartStatus === "delivered" || cartStatus === "cancelled") && (
                  <div className="cart-section tracking-section" style={{ padding: "16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Order Tracking</div>
                    <Tracking trackDetails={trackingDetails} />
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="right-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <div className="savings-section" style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                  borderRadius: 16, padding: "18px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: "0 8px 24px rgba(124,58,237,0.22)",
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Your Total Savings</div>
                    <div className="savings-amount" style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalSavingsNum}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "5px 13px" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>BIG DEAL</span>
                  </div>
                </div>

                {deliveryAddress ? (
                  <div className="address-section cart-section" onClick={() => !cart_id_external && setShowAddressModal(true)} style={{ padding: "16px", cursor: cart_id_external ? "default" : "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <MdLocationOn size={16} color="#7c3aed" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Deliver to: {deliveryAddress.name}</span>
                        {deliveryAddress.type && (
                          <span style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>{deliveryAddress.type}</span>
                        )}
                      </div>
                      {!cart_id_external && (
                        <button onClick={e => { e.stopPropagation(); setShowAddressModal(true); }} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <MdEdit size={14} /> Change
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5, paddingLeft: 23, wordBreak: "break-word" }}>
                      {deliveryAddress.addressLine1}, {deliveryAddress.addressLine2}, {deliveryAddress.state} — {deliveryAddress.pincode}
                    </div>
                    {deliveryAddress.phone_number && (
                      <div style={{ fontSize: 12, color: "#6b7280", paddingLeft: 23, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                        <MdPhone size={14} color="#7c3aed" />
                        <span>{deliveryAddress.phone_number}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="address-section cart-section" onClick={() => !cart_id_external && setShowAddressModal(true)} style={{ padding: "20px 16px", cursor: "pointer", border: "1.5px dashed #fca5a5", background: "#fffefe" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444" }}>
                        <MdLocationOn size={22} color="#ef4444" />
                        <span style={{ fontSize: 14, fontWeight: 800 }}>Select Delivery Address <span style={{ color: "#ef4444", fontSize: 18 }}>*</span></span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, paddingLeft: 30, fontWeight: 500 }}>
                        Required to calculate shipping charges
                    </p>
                  </div>
                )}

                <div className="coupons-section cart-section" style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <MdLocalOffer size={16} color="#7c3aed" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Save more with coupons</span>
                    </div>
                    <span onClick={() => setShowOffersModal(true)} style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, cursor: "pointer" }}>View all</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="coupon-input"
                      type="text"
                      disabled={false}
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontSize: 13,
                        fontFamily: "Inter, sans-serif",
                        backgroundColor: "#fff",
                        color: "#111827",
                        fontWeight: 700
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !offerTitle) {
                          handleApplyCoupon(couponCode);
                        }
                      }}
                    />
                    <button
                      onClick={() => { if (!offerTitle) handleApplyCoupon(couponCode); }}
                      style={{
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: offerTitle ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      {offerTitle ? "✓ APPLIED" : "APPLY"}
                    </button>
                  </div>
                  {offerTitle && (
                    <div style={{ marginTop: 10, background: "#f5f3ff", border: "1px dashed #c4b5fd", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 800 }}>✓ {couponCode}</span>
                      <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, marginLeft: 6 }}>{offerTitle} applied!</span>
                    </div>
                  )}
                </div>

                <div id="prescription-error-scroll" className="rx-mgmt-section cart-section" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ background: "#f5f3ff", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                      <MdMedicalServices size={18} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Prescription Management</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ border: prescriptionChoice === "have" ? "1.5px solid #7c3aed" : "1.5px solid #f3f4f6", borderRadius: 16, padding: "16px", transition: "all 0.2s ease", background: prescriptionChoice === "have" ? "#fdfcff" : "#fff" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: prescriptionChoice === "have" ? 16 : 0 }}>
                        <input type="radio" name="prescriptionChoice" value="have" checked={prescriptionChoice === "have"} onChange={() => setPrescriptionChoice("have")} style={{ accentColor: "#7c3aed", width: 18, height: 18 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: prescriptionChoice === "have" ? "#7c3aed" : "#374151" }}>I have a prescription</span>
                      </label>
                      {prescriptionChoice === "have" && (
                        <div style={{ paddingLeft: 30, display: "flex", flexDirection: "column", gap: 14 }}>
                          <button onClick={() => setShowPrescriptionModal(true)} style={{ width: "100%", background: "#fff", border: "1.5px solid #7c3aed", borderRadius: 12, padding: "12px", color: "#7c3aed", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <MdCloudUpload size={18} /> Upload Prescription
                          </button>
                          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: Object.keys(prescriptionDetails).length === 0 ? "not-allowed" : "pointer", opacity: Object.keys(prescriptionDetails).length === 0 ? 0.6 : 1 }}>
                            <input
                              type="checkbox"
                              disabled={Object.keys(prescriptionDetails).length === 0}
                              checked={prescriptionValidConfirmed}
                              onChange={(e) => { setPrescriptionValidConfirmed(e.target.checked); if (e.target.checked) setShowPrescriptionError(false); }}
                              style={{ accentColor: "#7c3aed", marginTop: 3, cursor: Object.keys(prescriptionDetails).length === 0 ? "not-allowed" : "pointer" }}
                            />
                            <span className="rx-confirm-text" style={{ fontSize: 12, color: showPrescriptionError ? "#ef4444" : "#6b7280", lineHeight: 1.4, fontWeight: 400 }}>
                              I confirm that I am uploading a valid medical prescription.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div style={{ border: (prescriptionChoice === "donthave" ? "1.5px solid #7c3aed" : "1.5px solid #f3f4f6"), borderRadius: 16, padding: "16px", transition: "all 0.2s ease", background: (prescriptionChoice === "donthave" ? "#fdfcff" : "#fff") }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                        <input type="radio" name="prescriptionChoice" value="donthave" checked={prescriptionChoice === "donthave"} onChange={() => { setPrescriptionChoice("donthave"); setShowPrescriptionError(false); }} disabled={Object.keys(prescriptionDetails).length > 0} style={{ accentColor: "#7c3aed", width: 18, height: 18, cursor: Object.keys(prescriptionDetails).length > 0 ? "not-allowed" : "pointer", opacity: Object.keys(prescriptionDetails).length > 0 ? 0.5 : 1 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", opacity: Object.keys(prescriptionDetails).length > 0 ? 0.5 : 1 }}>I don't have a prescription</span>
                      </label>
                    </div>
                  </div>

                  {Object.keys(prescriptionDetails).length > 0 && (
                    <div style={{ position: "relative", marginTop: 20, background: "#f5f3ff", borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #e0d7ff" }}>
                      <button onClick={handleRemovePrescription} style={{ position: "absolute", top: -8, right: -8, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)", zIndex: 1 }} title="Remove Prescription">
                        <MdClose size={14} />
                      </button>
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", border: "1.5px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <img src={"https://d1dh0rr5xj2p49.cloudfront.net/prescription/" + prescriptionDetails.prescription_image_url} alt="Prescription" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 2 }}>{prescriptionDetails.prescription_name}</div>
                        {prescriptionDetails.prescription_date && (
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Uploaded: {formatPrescriptionDate(prescriptionDetails.prescription_date)}</div>
                        )}
                      </div>
                      <button onClick={() => setShowPrescriptionModal(true)} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px" }}>Change</button>
                    </div>
                  )}
                </div>

                {coinsNum && coinsNum !== "0 Coins" && (
                  <div className="coins-section" style={{ background: "#fff", border: "1px solid #f0eeff", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🪙</span>
                    <div>
                      <span style={{ fontSize: 13, color: "#374151" }}>Earn </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#7c3aed" }}>{coinsNum}</span>
                      <span style={{ fontSize: 13, color: "#374151" }}> on this order</span>
                    </div>
                  </div>
                )}

                <div className="summary-section cart-section" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ background: "#f5f3ff", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MdShoppingCart size={14} color="#7c3aed" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: 0.3 }}>Order Summary</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{orderSummary.itemsCount} item{orderSummary.itemsCount !== 1 ? "s" : ""}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>MRP Total</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{orderSummary.totalMRP}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Product Discount</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>-{orderSummary.totalSavings}</span>
                    </div>

                    { (totalAmt >= 1000 || offerTitle?.toLowerCase().includes("1000") || offerTitle?.toLowerCase().includes("free deivery")) && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Offer Discount (5%)</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>-Rs. {(totalAmt * 0.05).toFixed(2)}</span>
                      </div>
                    )}

                    {offerTitle && (
                      <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", margin: "2px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MdLocalOffer size={11} color="#16a34a" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Coupon Applied</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>-{offerTitle}</span>
                        </div>
                        {couponCode && (
                          <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ background: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.8, textTransform: "uppercase", border: "1px dashed #86efac" }}>{couponCode}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  <div style={{ height: 1, background: "linear-gradient(to right, transparent, #e9e5f5, transparent)", margin: "14px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Order Total</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{orderSummary.total_selling_price || `Rs. ${orderSummary.totalAmount}`}</span>
                  </div>

                  {cartStatus === "confirm" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Delivery Fee</span>
                        {(orderSummary.total_shipping_charge && totalAmt < 1000) ? (
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Rs. {orderSummary.total_shipping_charge}</span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Free <MdCelebration size={14} color="#16a34a" /></span>
                        )}
                      </div>
                      {orderSummary.cod_charge > 0 && <SummaryRow label="COD Charge" value={`Rs. ${orderSummary.cod_charge}`} />}
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Delivery Fee</span>
                        {totalAmt >= FREE_DELIVERY_THRESHOLD ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Free <MdCelebration size={14} color="#16a34a" /></span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Rs. {getDerivedDeliveryCharge().toFixed(2)}</span>
                        )}
                      </div>
                      {orderSummary.cod_charge > 0 && <SummaryRow label="COD Charge" value={`Rs. ${orderSummary.cod_charge}`} />}
                    </>
                  )}

                  <div className="desktop-only-summary-row" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", borderRadius: 12, padding: "14px 16px", marginTop: 14, border: "1px solid #e0d7ff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#374151" }}>Total Payable</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#7c3aed", letterSpacing: -0.5 }}>Rs. {finalPayableAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="buttons-section" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cartStatus === "active" && (() => {
                    const isAddressMissing = !deliveryAddress || !deliveryAddress.pincode || !deliveryAddress.addressLine1;
                    const isProceedDisabled = (prescriptionChoice === "have" && !prescriptionValidConfirmed) || isAddressMissing;
                    const handleProceedClick = () => {
                      if (isProceedDisabled) {
                        if (isAddressMissing) {
                          const el = document.querySelector('.address-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.boxShadow = '0 0 0 3px #ef4444';
                            setTimeout(() => { el.style.boxShadow = ''; }, 1500);
                          }
                        }
                        if (prescriptionChoice === "have" && !prescriptionValidConfirmed) {
                          setShowPrescriptionError(true);
                          const el = document.getElementById("prescription-error-scroll");
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        return;
                      }
                      handlePlaceOrder();
                    };
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button className="proceed-btn" onClick={handleProceedClick} style={{ width: "100%", background: isProceedDisabled ? "#c4b5fd" : "#7c3aed", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 800, cursor: isProceedDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isProceedDisabled ? "none" : "0 6px 20px rgba(124,58,237,0.3)", transition: "all 0.2s ease", opacity: isProceedDisabled ? 0.7 : 1 }}>
                          Proceed <FiArrowRight size={18} />
                        </button>
                      </div>
                    );
                  })()}

                  {cartStatus === "pending_confirm" && (() => {
                    const isProceedDisabled = prescriptionChoice === "have" && !prescriptionValidConfirmed;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button className="proceed-btn" onClick={async () => { if (isProceedDisabled) { setShowPrescriptionError(true); const el = document.getElementById("prescription-error-scroll"); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } if (await safeCheck("confirm")) handlePay(); }} style={{ width: "100%", background: isProceedDisabled ? "#c4b5fd" : "#7c3aed", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 800, cursor: isProceedDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isProceedDisabled ? "none" : "0 6px 20px rgba(124,58,237,0.3)", transition: "all 0.2s active:scale(0.98)", opacity: isProceedDisabled ? 0.7 : 1 }}>
                          Proceed <FiArrowRight size={18} />
                        </button>
                      </div>
                    );
                  })()}

                  {cartStatus === "confirm" && paymentmode === "Online" && (() => {
                    const isProceedDisabled = prescriptionChoice === "have" && !prescriptionValidConfirmed;
                    return (
                      <button className="proceed-btn" disabled={isProceedDisabled} onClick={async () => { if (!isProceedDisabled && (await safeCheck("confirm"))) handlePay(); }} style={{ width: "100%", background: isProceedDisabled ? "#c4b5fd" : "#7c3aed", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 800, cursor: isProceedDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isProceedDisabled ? "none" : "0 6px 20px rgba(124,58,237,0.3)", opacity: isProceedDisabled ? 0.7 : 1 }}>Proceed to Pay <FiArrowRight size={18} />
                      </button>
                    );
                  })()}
                </div>

                <div className="badges-section" style={{ display: "flex", justifyContent: "center", gap: 20, padding: "4px 0" }}>
                  {[
                    { icon: <FiShield size={13} color="#7c3aed" />, label: "SECURE" },
                    { icon: <BsPatchCheckFill size={13} color="#7c3aed" />, label: "GENUINE" },
                    { icon: <MdAssignmentInd size={13} color="#7c3aed" />, label: "DOCTOR APPROVED" },
                  ].map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {b.icon}
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.4 }}>{b.label}</span>
                    </div>
                  ))}
                </div>

                <div className="support-section" style={{ background: "#f0f7ff", border: "1px solid #dbeafe", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#fff", padding: 9, borderRadius: "50%", boxShadow: "0 2px 8px rgba(59,130,246,.12)", display: "flex", flexShrink: 0 }}>
                    <img src="/Pharmacist_Support.svg" style={{ width: 20, height: 20 }} alt="" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Pharmacist Support</div>
                    <div style={{ fontSize: 11, color: "#93c5fd" }}>Have questions? We're here.</div>
                  </div>
                  <a href="tel:+917090123709" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>Call Now</a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="landing-page">
          </div>
      </div>
      {!loading && cartItems.length > 0 && (
        <div className="mobile-sticky-footer">
          <div className="sticky-footer-content">
            <div className="sticky-footer-amount">
              <div className="amount-label">ORDER TOTAL</div>
              <div className="amount-value">Rs. {finalPayableAmount.toFixed(2)}</div>
            </div>
            {(() => {
              const isAddressMissing = !deliveryAddress || !deliveryAddress.pincode || !deliveryAddress.addressLine1;
              const isProceedDisabled = (prescriptionChoice === "have" && !prescriptionValidConfirmed) || isAddressMissing;
              const handleMobileProceed = () => {
                if (isProceedDisabled) {
                  if (isAddressMissing) {
                    const el = document.querySelector('.address-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.style.boxShadow = '0 0 0 3px #ef4444';
                      setTimeout(() => { el.style.boxShadow = ''; }, 1500);
                    }
                  }
                  if (prescriptionChoice === "have" && !prescriptionValidConfirmed) {
                    setShowPrescriptionError(true);
                    const el = document.getElementById("prescription-error-scroll");
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  return;
                }
                handleStickyProceed();
              };
              return (
                <button className="sticky-proceed-btn" onClick={handleMobileProceed} style={{ background: isProceedDisabled ? "#c4b5fd" : "#7c3aed", cursor: isProceedDisabled ? "not-allowed" : "pointer", opacity: isProceedDisabled ? 0.7 : 1 }}>
                  Proceed <FiArrowRight size={18} />
                </button>
              );
            })()}
          </div>
        </div>
      )}
      <Navigation />
    </>
  );
};

export { AddressSelectionModal };
export default OrderProgress;