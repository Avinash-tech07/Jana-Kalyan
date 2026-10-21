package com.janakalyan.model;

/**
 * A regular society member. Extends User (INHERITANCE) and owns exactly
 * one Account, plus the nominee details required by the spec.
 */
public class Member extends User {

    private Account account;
    private String photoUrl;      // path/URL to the member's photo, shown on the dashboard
    private String nomineeName;
    private String nomineeId;     // e.g. Aadhaar / Voter ID number

    public Member(String userId, String fullName, String email, String phone, Account account) {
        super(userId, fullName, email, phone);
        this.account = account;
    }

    public Account getAccount() { return account; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getNomineeName() { return nomineeName; }
    public void setNomineeName(String nomineeName) { this.nomineeName = nomineeName; }

    public String getNomineeId() { return nomineeId; }
    public void setNomineeId(String nomineeId) { this.nomineeId = nomineeId; }

    /** Whether this member's photo can be shown on the dashboard (spec requirement). */
    public boolean hasPhoto() {
        return photoUrl != null && !photoUrl.isBlank();
    }

    @Override
    public String dashboardSummary() {
        return String.format(
            "%s | Balance: %.2f | Nominee: %s",
            getFullName(), account.getBalance(),
            nomineeName != null ? nomineeName : "Not set"
        );
    }
}
