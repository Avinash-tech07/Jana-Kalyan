package com.janakalyan.model;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Models a loan type and a specific loan application.
 * Encodes the spec's rules directly so the UI/backend can never diverge:
 *   - "Personal loan" is named "Kalyan loan" and is the only enabled type.
 *   - Kalyan loan interest is fixed at 13%.
 *   - Duration options depend on the loan amount (see DURATION_TABLE).
 */
public class Loan {

    /** A loan product on offer (some enabled, some intentionally disabled). */
    public record LoanType(String name, double interestRate, boolean enabled) {}

    public static final LoanType KALYAN_LOAN = new LoanType("Kalyan loan", 13.0, true);

    public static final List<LoanType> ALL_LOAN_TYPES = List.of(
        KALYAN_LOAN,
        new LoanType("Vehicle loan", 11.5, false),
        new LoanType("Education loan", 9.0, false),
        new LoanType("Housing loan", 8.5, false)
    );

    /** Loan amount -> available durations (months), exactly as specified by the client. */
    private static final Map<Double, List<Integer>> DURATION_TABLE = new TreeMap<>(Map.of(
        6000.0, List.of(3, 6),
        12000.0, List.of(3, 6, 12),
        18000.0, List.of(3, 6, 12, 18),
        24000.0, List.of(3, 6, 12, 18, 24),
        60000.0, List.of(3, 6, 12, 18, 24, 30),
        360000.0, List.of(3, 6, 12, 18, 24, 30, 36)
    ));

    private final String loanAppId;
    private final String memberId;
    private final double amount;
    private final int durationMonths;
    private String status = "pending";

    public Loan(String loanAppId, String memberId, double amount, int durationMonths) {
        if (!DURATION_TABLE.containsKey(amount)) {
            throw new IllegalArgumentException("No duration options configured for amount: " + amount);
        }
        if (!durationsFor(amount).contains(durationMonths)) {
            throw new IllegalArgumentException("Duration " + durationMonths + " months is not valid for amount " + amount);
        }
        this.loanAppId = loanAppId;
        this.memberId = memberId;
        this.amount = amount;
        this.durationMonths = durationMonths;
    }

    /** Returns the valid duration list for a given loan amount. */
    public static List<Integer> durationsFor(double amount) {
        List<Integer> exact = DURATION_TABLE.get(amount);
        if (exact != null) return exact;
        if (amount >= 360000) return DURATION_TABLE.get(360000.0);
        throw new IllegalArgumentException("Unsupported loan amount: " + amount);
    }

    /** Simple-interest total payable for the Kalyan loan (13% p.a.). */
    public double totalPayable() {
        double years = durationMonths / 12.0;
        double interest = amount * (KALYAN_LOAN.interestRate() / 100.0) * years;
        return amount + Math.round(interest * 100.0) / 100.0;
    }

    public double monthlyInstalment() {
        return Math.round((totalPayable() / durationMonths) * 100.0) / 100.0;
    }

    public String getLoanAppId() { return loanAppId; }
    public String getMemberId() { return memberId; }
    public double getAmount() { return amount; }
    public int getDurationMonths() { return durationMonths; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
