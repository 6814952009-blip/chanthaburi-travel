import { useEffect, useState } from "react";

const blankForm = () => ({
    district: "",
    slug: `place-${Date.now().toString(36)}`,
    name: { th: "", en: "", zh: "" },
    history: { th: "", en: "", zh: "" },
    description: { th: "", en: "", zh: "" },
    address: { th: "", en: "", zh: "" },
    openingHours: { th: "", en: "", zh: "" },
    googleMapsUrl: "",
    category: "nature",
    longitude: "102.1",
    latitude: "12.61",
    imageUrls: [],
    isActive: true,
});

const blankDistrict = () => ({
    name: { th: "", en: "", zh: "" },
    introduction: { th: "", en: "", zh: "" },
    longitude: "",
    latitude: "",
    googleMapsUrl: "",
});

const localized = (values) => ({
    th: values.th.trim(),
    en: values.en.trim() || values.th.trim(),
    zh: values.zh.trim() || values.th.trim(),
});

const fromPlace = (place) => ({
    district: place.district?._id || place.district || "",
    slug: place.slug || "",
    name: { th: place.name?.th || "", en: place.name?.en || "", zh: place.name?.zh || "" },
    history: { th: place.history?.th || "", en: place.history?.en || "", zh: place.history?.zh || "" },
    description: { th: place.description?.th || "", en: place.description?.en || "", zh: place.description?.zh || "" },
    address: { th: place.address?.th || "", en: place.address?.en || "", zh: place.address?.zh || "" },
    openingHours: { th: place.openingHours?.th || "", en: place.openingHours?.en || "", zh: place.openingHours?.zh || "" },
    googleMapsUrl: place.googleMapsUrl || "",
    category: place.categories?.includes("restaurant") ? "restaurant" : place.categories?.[0] || "nature",
    longitude: String(place.location?.coordinates?.[0] ?? ""),
    latitude: String(place.location?.coordinates?.[1] ?? ""),
    imageUrls: place.imageUrls || [],
    isActive: place.isActive !== false,
});

async function request(path, token, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...options.headers,
        },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
}

export default function AdminPanel({ token, onClose, onPlaceSaved }) {
    const [places, setPlaces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedId, setSelectedId] = useState("new");
    const [form, setForm] = useState(blankForm);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDistrictForm, setShowDistrictForm] = useState(false);
    const [districtDraft, setDistrictDraft] = useState(blankDistrict);
    const [savingDistrict, setSavingDistrict] = useState(false);
    const [message, setMessage] = useState("");
    const isNew = selectedId === "new";

    useEffect(() => {
        let active = true;
        Promise.all([
            request("/api/admin/places", token),
            request("/api/admin/districts", token),
        ]).then(([placeList, districtList]) => {
            if (!active) return;
            setPlaces(placeList);
            setDistricts(districtList);
            setForm((current) => ({ ...current, district: current.district || districtList[0]?._id || "" }));
        }).catch((error) => {
            if (active) setMessage(error.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [token]);

    const updateLocalized = (field, language, value) => {
        setForm((current) => ({ ...current, [field]: { ...current[field], [language]: value } }));
    };

    const choosePlace = (place) => {
        setSelectedId(place._id);
        setForm(fromPlace(place));
        setMessage("");
    };

    const startNew = () => {
        setSelectedId("new");
        setForm({ ...blankForm(), district: districts[0]?._id || "" });
        setMessage("");
    };

    const createDistrict = async () => {
        const longitude = Number(districtDraft.longitude);
        const latitude = Number(districtDraft.latitude);
        if (!districtDraft.name.th.trim() || !districtDraft.introduction.th.trim() || !districtDraft.googleMapsUrl.trim() || districtDraft.longitude === "" || districtDraft.latitude === "" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            setMessage("Enter a Thai name and introduction, valid coordinates, and a Google Maps URL.");
            return;
        }
        setSavingDistrict(true);
        setMessage("");
        const baseCode = districtDraft.name.en || `DIST-${Date.now()}`;
        const code = baseCode.toUpperCase().trim().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || `DIST-${Date.now()}`;
        const payload = {
            code,
            name: localized(districtDraft.name),
            introduction: localized(districtDraft.introduction),
            center: { type: "Point", coordinates: [longitude, latitude] },
            googleMapsUrl: districtDraft.googleMapsUrl.trim(),
            displayOrder: districts.length,
        };
        try {
            const district = await request("/api/admin/districts", token, { method: "POST", body: JSON.stringify(payload) });
            setDistricts((current) => [...current, district].sort((a, b) => a.displayOrder - b.displayOrder));
            setForm((current) => ({ ...current, district: district._id }));
            setDistrictDraft(blankDistrict());
            setShowDistrictForm(false);
            setMessage("District added");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSavingDistrict(false);
        }
    };

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        const payload = {
            district: form.district,
            slug: form.slug.trim(),
            name: localized(form.name),
            history: localized(form.history),
            description: localized(form.description),
            address: localized(form.address),
            googleMapsUrl: form.googleMapsUrl.trim(),
            categories: [form.category],
            location: { type: "Point", coordinates: [Number(form.longitude), Number(form.latitude)] },
            imageUrls: form.imageUrls,
            isActive: form.isActive,
        };
        const hours = form.openingHours.th.trim() || form.openingHours.en.trim() || form.openingHours.zh.trim();
        if (hours) payload.openingHours = localized(form.openingHours);

        try {
            const place = await request(isNew ? "/api/admin/places" : `/api/admin/places/${selectedId}`, token, {
                method: isNew ? "POST" : "PATCH",
                body: JSON.stringify(payload),
            });
            setPlaces((current) => [place, ...current.filter((item) => item._id !== place._id)]);
            setSelectedId(place._id);
            setForm(fromPlace(place));
            onPlaceSaved?.(place);
            window.dispatchEvent(new CustomEvent("travel:place-saved", { detail: place }));
            setMessage("Saved");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    const uploadPhoto = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setUploading(true);
        setMessage("");
        const body = new FormData();
        body.append("file", file);
        try {
            const result = await request("/api/admin/uploads", token, { method: "POST", body });
            setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, result.url] }));
        } catch (error) {
            setMessage(error.message);
        } finally {
            setUploading(false);
        }
    };

    const visiblePlaces = places.filter((place) =>
        `${place.name?.th || ""} ${place.district?.name?.th || ""}`.toLowerCase().includes(search.toLowerCase())
    );

    return <div className="admin-overlay">
        <section className="admin-workspace" aria-label="Admin place management">
            <header className="admin-header">
                <div><p className="eyebrow">CONTENT MANAGEMENT</p><h1>Places & restaurants</h1></div>
                <button type="button" className="admin-close" onClick={onClose} aria-label="Close admin">×</button>
            </header>
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <button type="button" className="admin-new" onClick={startNew}>＋ Add a place</button>
                    <label className="admin-search"><span>Search places</span><input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                    <div className="admin-place-list">
                        {loading && <p className="admin-muted">Loading places…</p>}
                        {!loading && visiblePlaces.map((place) => <button type="button" key={place._id} className={selectedId === place._id ? "selected" : ""} onClick={() => choosePlace(place)}>
                            <strong>{place.name?.th}</strong><span>{place.district?.name?.th?.replace(/^อำเภอ/, "") || "No district"}</span>
                        </button>)}
                        {!loading && !visiblePlaces.length && <p className="admin-muted">No saved places yet</p>}
                    </div>
                </aside>
                <form className="admin-form" onSubmit={save}>
                    <div className="admin-form-heading"><div><p className="eyebrow">{isNew ? "NEW LISTING" : "EDIT LISTING"}</p><h2>{isNew ? "Add a destination" : form.name.th || "Edit destination"}</h2></div>
                        <button type="submit" className="admin-save" disabled={saving || uploading}>{saving ? "Saving…" : "Save changes"}</button>
                    </div>
                    {message && <p className={message === "Saved" ? "admin-message success" : "admin-message"} role="status">{message}</p>}
                    {loading && <p className="admin-muted">Loading editor…</p>}
                    <fieldset disabled={saving || loading}>
                        <div className="admin-grid two">
                            <div className="admin-district-field"><label>District<select required value={form.district} disabled={!districts.length} onChange={(event) => setForm({ ...form, district: event.target.value })}><option value="">{districts.length ? "Choose district" : "No districts yet"}</option>{districts.map((item) => <option value={item._id} key={item._id}>{item.name?.th}</option>)}</select></label><button type="button" className="admin-add-district" onClick={() => setShowDistrictForm((visible) => !visible)}>{showDistrictForm ? "Cancel" : "+ Add district"}</button></div>
                            <label>Type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="nature">Attraction</option><option value="culture">Culture</option><option value="beach">Beach</option><option value="waterfall">Waterfall</option><option value="community">Community</option><option value="cafe">Cafe</option><option value="restaurant">Restaurant</option></select></label>
                            <label className="span-two">URL slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label>
                        </div>
                        {showDistrictForm && <section className="admin-district-create"><div className="admin-section-heading"><div><h3>Add a district</h3><p>Its map point and map link are required.</p></div><button type="button" className="admin-district-submit" onClick={createDistrict} disabled={savingDistrict}>{savingDistrict ? "Saving…" : "Save district"}</button></div><div className="admin-grid three">{[["th", "Thai name"], ["en", "English name"], ["zh", "Chinese name"]].map(([language, label]) => <label key={language}>{label}<input required={language === "th"} value={districtDraft.name[language]} onChange={(event) => setDistrictDraft((current) => ({ ...current, name: { ...current.name, [language]: event.target.value } }))} /></label>)}{[["th", "Thai introduction"], ["en", "English introduction"], ["zh", "Chinese introduction"]].map(([language, label]) => <label key={language}>{label}<textarea required={language === "th"} rows="2" value={districtDraft.introduction[language]} onChange={(event) => setDistrictDraft((current) => ({ ...current, introduction: { ...current.introduction, [language]: event.target.value } }))} /></label>)}<label>Longitude<input type="number" min="-180" max="180" step="any" required value={districtDraft.longitude} onChange={(event) => setDistrictDraft((current) => ({ ...current, longitude: event.target.value }))} /></label><label>Latitude<input type="number" min="-90" max="90" step="any" required value={districtDraft.latitude} onChange={(event) => setDistrictDraft((current) => ({ ...current, latitude: event.target.value }))} /></label><label className="span-two">Google Maps URL<input type="url" required value={districtDraft.googleMapsUrl} onChange={(event) => setDistrictDraft((current) => ({ ...current, googleMapsUrl: event.target.value }))} /></label></div></section>}
                        <section className="admin-section"><h3>Name</h3><div className="admin-grid three">{[["th", "Thai"], ["en", "English"], ["zh", "Chinese"]].map(([language, label]) => <label key={language}>{label}<input required={language === "th"} value={form.name[language]} onChange={(event) => updateLocalized("name", language, event.target.value)} /></label>)}</div></section>
                        <section className="admin-section"><h3>Description</h3><div className="admin-grid three">{[["th", "Thai"], ["en", "English"], ["zh", "Chinese"]].map(([language, label]) => <label key={language}>{label}<textarea required={language === "th"} rows="3" value={form.description[language]} onChange={(event) => updateLocalized("description", language, event.target.value)} /></label>)}</div></section>
                        <section className="admin-section"><h3>Background / history</h3><div className="admin-grid three">{[["th", "Thai"], ["en", "English"], ["zh", "Chinese"]].map(([language, label]) => <label key={language}>{label}<textarea required={language === "th"} rows="3" value={form.history[language]} onChange={(event) => updateLocalized("history", language, event.target.value)} /></label>)}</div></section>
                        <section className="admin-section"><h3>Address</h3><div className="admin-grid three">{[["th", "Thai"], ["en", "English"], ["zh", "Chinese"]].map(([language, label]) => <label key={language}>{label}<input required={language === "th"} value={form.address[language]} onChange={(event) => updateLocalized("address", language, event.target.value)} /></label>)}</div></section>
                        <div className="admin-grid two">
                            <label>Google Maps URL<input type="url" required value={form.googleMapsUrl} onChange={(event) => setForm({ ...form, googleMapsUrl: event.target.value })} /></label>
                            <label>Opening hours<input placeholder="e.g. Daily, 08:00–17:00" value={form.openingHours.th} onChange={(event) => updateLocalized("openingHours", "th", event.target.value)} /></label>
                            <label>Longitude<input type="number" min="-180" max="180" step="any" required value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></label>
                            <label>Latitude<input type="number" min="-90" max="90" step="any" required value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></label>
                        </div>
                        <section className="admin-section"><div className="admin-section-heading"><div><h3>Photos</h3><p>Image files up to 5 MB</p></div><label className="admin-upload">{uploading ? "Uploading…" : "＋ Upload photo"}<input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} /></label></div>
                            <div className="admin-photo-grid">{form.imageUrls.map((url, index) => <figure key={`${url}-${index}`}><img src={url} alt={`Place photo ${index + 1}`} /><button type="button" onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, photoIndex) => photoIndex !== index) }))} aria-label={`Remove photo ${index + 1}`}>×</button></figure>)}{!form.imageUrls.length && <p className="admin-muted">No photos added</p>}</div>
                        </section>
                        <label className="admin-active"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Visible to visitors</label>
                    </fieldset>
                </form>
            </div>
        </section>
    </div>;
}