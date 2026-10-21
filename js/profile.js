/* =========================================================================
   JANA KALYAN — MEMBER PROFILE (profile.html)
   -------------------------------------------------------------------------
   Spec: "The Member profile must include the nominee's name, nominee ID
   details, and phone number."
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async function () {
  const session = JK.requireAuth(false);
  if (!session) return;

  const members = JSON.parse(localStorage.getItem("jk_members") || "[]");
  let member = members.find((m) => m.id === session.id);

  const result = await JK.api("/members/" + session.id, { method: "GET" });
  if (result && result.member) member = result.member;
  if (!member) return;

  const form = document.getElementById("profile-form");
  if (!form) return;

  // Pre-fill form with current values.
  form.fullName.value = member.name || "";
  form.email.value = member.email || "";
  form.phone.value = member.phone || "";
  form.nomineeName.value = member.nomineeName || "";
  form.nomineeId.value = member.nomineeId || "";

  const photoPreview = document.getElementById("photo-preview");
  if (photoPreview && member.photo) {
    photoPreview.innerHTML = `<img src="${member.photo}" alt="Current member photo" />`;
  }

  const photoInput = document.getElementById("photo-input");
  let newPhotoDataUrl = null;
  if (photoInput) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        newPhotoDataUrl = reader.result;
        photoPreview.innerHTML = `<img src="${newPhotoDataUrl}" alt="New member photo preview" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const updated = {
      ...member,
      name: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      nomineeName: form.nomineeName.value.trim(),
      nomineeId: form.nomineeId.value.trim(),
      photo: newPhotoDataUrl || member.photo,
    };

    // Persist locally (demo) and attempt the real backend call.
    const idx = members.findIndex((m) => m.id === member.id);
    if (idx > -1) members[idx] = updated;
    localStorage.setItem("jk_members", JSON.stringify(members));

    await JK.api("/members/" + member.id, { method: "PUT", body: JSON.stringify(updated) });

    const msg = document.getElementById("profile-msg");
    if (msg) {
      msg.textContent = "Profile updated successfully.";
      msg.classList.add("show", "success");
    }
  });
});
